package main

import (
	"context"
	"fmt"
	"net"
	"os"
	"os/signal"
	"syscall"

	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	"project/pkg/common"
	pb "project/pkg/proto/auth"
)

type Service struct {
	pb.UnimplementedAuthServiceServer
	config *common.Config
	logger *zap.Logger
}

func main() {
	// Initialize
	config := common.LoadConfig()
	logger := common.NewLogger(config.Environment)

	// Create service
	svc := &Service{
		config: config,
		logger: logger,
	}

	// Start gRPC server
	svc.startGRPCServer()
}

func (s *Service) startGRPCServer() {
	lis, err := net.Listen("tcp", ":"+s.config.Port)
	if err != nil {
		s.logger.Fatal("failed to listen", zap.Error(err))
	}

	grpcServer := grpc.NewServer()
	pb.RegisterAuthServiceServer(grpcServer, s)

	// Register reflection service on gRPC server.
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

	// Mock logic
	if req.Email == "test@example.com" && req.Password == "password" {
		return &pb.LoginResponse{
			Token: "mock-jwt-token",
			User: &pb.User{
				Id:    "1",
				Email: req.Email,
			},
		}, nil
	}

	return nil, fmt.Errorf("invalid credentials")
}

func (s *Service) Register(ctx context.Context, req *pb.RegisterRequest) (*pb.RegisterResponse, error) {
	s.logger.Info("Register request", zap.String("email", req.Email))

	// Mock logic
	return &pb.RegisterResponse{
		Id:    "1",
		Email: req.Email,
	}, nil
}

func (s *Service) Validate(ctx context.Context, req *pb.ValidateRequest) (*pb.ValidateResponse, error) {
	// Mock logic
	return &pb.ValidateResponse{
		Valid:  true,
		UserId: "1",
	}, nil
}
