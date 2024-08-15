package main

import (
	"context"
	"database/sql"
	"fmt"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/golang-jwt/jwt/v5"
	_ "github.com/lib/pq"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	"project/pkg/common"
	pb "project/pkg/proto/auth"
)

var jwtSecret []byte

func init() {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		// Development fallback - production should always set JWT_SECRET
		secret = "dev-secret-minimum-blog-change-in-production"
	}
	jwtSecret = []byte(secret)
}

type Service struct {
	pb.UnimplementedAuthServiceServer
	config *common.Config
	logger *zap.Logger
	db     *sql.DB
}

func main() {
	// Initialize
	config := common.LoadConfig()
	logger := common.NewLogger(config.Environment)

	// Connect to PostgreSQL
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://postgres:postgres@postgres:5432/auth_db?sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		logger.Fatal("failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	// Test connection with retry
	for i := 0; i < 10; i++ {
		if err := db.Ping(); err != nil {
			logger.Info("waiting for database...", zap.Int("attempt", i+1))
			time.Sleep(2 * time.Second)
			continue
		}
		break
	}
	if err := db.Ping(); err != nil {
		logger.Fatal("failed to ping database", zap.Error(err))
	}
	logger.Info("connected to auth database")

	// Create service
	svc := &Service{
		config: config,
		logger: logger,
		db:     db,
	}

	// Ensure users table and seed demo user
	svc.seedDemoUser()

	// Start gRPC server
	svc.startGRPCServer()
}

func (s *Service) seedDemoUser() {
	s.logger.Info("Ensuring auth users table exists...")

	// Enable UUID extension FIRST
	_, err := s.db.Exec(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`)
	if err != nil {
		s.logger.Error("failed to create uuid-ossp extension", zap.Error(err))
	}

	// Create users table if not exists
	_, err = s.db.Exec(`
		CREATE TABLE IF NOT EXISTS auth_users (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			name VARCHAR(255),
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		);
	`)
	if err != nil {
		s.logger.Error("failed to create auth_users table", zap.Error(err))
	}

	// Hash demo password
	demoPassword := "demo123"
	hash, err := bcrypt.GenerateFromPassword([]byte(demoPassword), bcrypt.DefaultCost)
	if err != nil {
		s.logger.Error("failed to hash demo password", zap.Error(err))
		return
	}

	// Insert demo user (Alice Chen)
	aliceID := "00000000-0000-0000-0000-000000000001"
	_, err = s.db.Exec(`
		INSERT INTO auth_users (id, email, password_hash, name) 
		VALUES ($1, 'alice@example.com', $2, 'Alice Chen')
		ON CONFLICT (id) DO UPDATE SET password_hash = $2
	`, aliceID, string(hash))
	if err != nil {
		s.logger.Error("failed to seed demo user", zap.Error(err))
	} else {
		s.logger.Info("Demo user seeded: alice@example.com / demo123")
	}
}

func (s *Service) startGRPCServer() {
	lis, err := net.Listen("tcp", ":"+s.config.Port)
	if err != nil {
		s.logger.Fatal("failed to listen", zap.Error(err))
	}

	grpcServer := grpc.NewServer()
	pb.RegisterAuthServiceServer(grpcServer, s)
	reflection.Register(grpcServer)

	go func() {
		s.logger.Info("starting gRPC server", zap.String("port", s.config.Port))
		if err := grpcServer.Serve(lis); err != nil {
			s.logger.Fatal("failed to serve", zap.Error(err))
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	s.logger.Info("shutting down gRPC server")
	grpcServer.GracefulStop()
}

// gRPC Handlers

func (s *Service) Login(ctx context.Context, req *pb.LoginRequest) (*pb.LoginResponse, error) {
	s.logger.Info("Login request", zap.String("email", req.Email))

	// Query user from database
	var id, email, passwordHash, name string
	err := s.db.QueryRowContext(ctx,
		"SELECT id, email, password_hash, COALESCE(name, '') FROM auth_users WHERE email = $1",
		req.Email,
	).Scan(&id, &email, &passwordHash, &name)

	if err == sql.ErrNoRows {
		s.logger.Info("user not found", zap.String("email", req.Email))
		return nil, fmt.Errorf("invalid credentials")
	}
	if err != nil {
		s.logger.Error("database error during login", zap.Error(err))
		return nil, fmt.Errorf("internal error")
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		s.logger.Info("invalid password", zap.String("email", req.Email))
		return nil, fmt.Errorf("invalid credentials")
	}

	// Generate JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": id,
		"email":   email,
		"name":    name,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		s.logger.Error("failed to sign token", zap.Error(err))
		return nil, fmt.Errorf("internal error")
	}

	s.logger.Info("login successful", zap.String("user_id", id))

	return &pb.LoginResponse{
		Token: tokenString,
		User: &pb.User{
			Id:    id,
			Email: email,
		},
	}, nil
}

func (s *Service) Register(ctx context.Context, req *pb.RegisterRequest) (*pb.RegisterResponse, error) {
	s.logger.Info("Register request", zap.String("email", req.Email))

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		s.logger.Error("failed to hash password", zap.Error(err))
		return nil, fmt.Errorf("internal error")
	}

	// Insert user
	var id string
	err = s.db.QueryRowContext(ctx,
		"INSERT INTO auth_users (email, password_hash) VALUES ($1, $2) RETURNING id",
		req.Email, string(hash),
	).Scan(&id)

	if err != nil {
		s.logger.Error("failed to register user", zap.Error(err))
		return nil, fmt.Errorf("email already exists or internal error")
	}

	s.logger.Info("user registered", zap.String("id", id))

	return &pb.RegisterResponse{
		Id:    id,
		Email: req.Email,
	}, nil
}

func (s *Service) Validate(ctx context.Context, req *pb.ValidateRequest) (*pb.ValidateResponse, error) {
	// Parse and validate JWT token
	token, err := jwt.Parse(req.Token, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		return &pb.ValidateResponse{
			Valid:  false,
			UserId: "",
		}, nil
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return &pb.ValidateResponse{
			Valid:  false,
			UserId: "",
		}, nil
	}

	userId, _ := claims["user_id"].(string)

	return &pb.ValidateResponse{
		Valid:  true,
		UserId: userId,
	}, nil
}
