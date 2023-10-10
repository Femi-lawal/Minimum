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

	"project/pkg/common"
	"project/pkg/middleware"
)

type Service struct {
	config *common.Config
	logger *zap.Logger
	router *gin.Engine
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
		"service":   "auth-service",
	})
}

// Mock handlers for now
func (s *Service) login(c *gin.Context) {
	// TODO: Implement actual login logic
	common.RespondSuccess(c, gin.H{"token": "mock-jwt-token", "user": gin.H{"id": "1", "email": "test@example.com"}})
}

func (s *Service) register(c *gin.Context) {
	// TODO: Implement actual register logic
	common.RespondCreated(c, gin.H{"id": "1", "email": "test@example.com"})
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
