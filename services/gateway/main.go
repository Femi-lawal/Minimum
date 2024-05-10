package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"project/pkg/common"
	"project/pkg/middleware"
	pb "project/pkg/proto"
)

type Service struct {
	config     *common.Config
	logger     *zap.Logger
	router     *gin.Engine
	authClient pb.AuthServiceClient
}

func main() {
	// Initialize
	config := common.LoadConfig()
	logger := common.NewLogger(config.Environment)

	// Connect to Auth Service via gRPC
	authServiceURL := getEnv("AUTH_SERVICE_URL", "localhost:8081")
	conn, err := grpc.Dial(authServiceURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		logger.Fatal("did not connect to auth service", zap.Error(err))
	}
	defer conn.Close()
	authClient := pb.NewAuthServiceClient(conn)

	// Create service
	svc := &Service{
		config:     config,
		logger:     logger,
		authClient: authClient,
	}

	// Setup router
	svc.setupRouter()

	// Start server with graceful shutdown
	svc.startServer()
}

func (s *Service) setupRouter() {
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()

	// Middleware
	r.Use(middleware.Logger(s.logger))
	r.Use(middleware.Recovery(s.logger))
	r.Use(middleware.CORS(s.config.AllowedOrigins))

	// Health check
	r.GET("/health", s.healthCheck)

	// API routes
	api := r.Group("/api/v1/auth")
	{
		api.POST("/login", s.login)
		api.POST("/register", s.register)
	}

	s.router = r
}

func (s *Service) healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"timestamp": time.Now().UTC(),
		"service":   "api-gateway",
	})
}

func (s *Service) login(c *gin.Context) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.RespondError(c, http.StatusBadRequest, "INVALID_REQUEST", err.Error())
		return
	}

	// Call gRPC service
	resp, err := s.authClient.Login(context.Background(), &pb.LoginRequest{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		s.logger.Error("grpc login failed", zap.Error(err))
		common.RespondError(c, http.StatusUnauthorized, "AUTH_FAILED", "Invalid credentials")
		return
	}

	common.RespondSuccess(c, gin.H{
		"token": resp.Token,
		"user":  resp.User,
	})
}

func (s *Service) register(c *gin.Context) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.RespondError(c, http.StatusBadRequest, "INVALID_REQUEST", err.Error())
		return
	}

	// Call gRPC service
	resp, err := s.authClient.Register(context.Background(), &pb.RegisterRequest{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		s.logger.Error("grpc register failed", zap.Error(err))
		common.RespondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Registration failed")
		return
	}

	common.RespondCreated(c, gin.H{
		"id":    resp.Id,
		"email": resp.Email,
	})
}

func (s *Service) startServer() {
	srv := &http.Server{
		Addr:         ":" + s.config.Port,
		Handler:      s.router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		s.logger.Info("starting server", zap.String("port", s.config.Port))
		if err := srv.ListenAndServe(); err != http.ErrServerClosed {
			s.logger.Fatal("server error", zap.Error(err))
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		s.logger.Error("server shutdown error", zap.Error(err))
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
