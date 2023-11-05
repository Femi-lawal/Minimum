package main

import (
	"context"
	"net/http"
	"net/http/httputil"
	"net/url"
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

	// Proxy routes
	// In a real scenario, these URLs would come from config/env
	authServiceURL := getEnv("AUTH_SERVICE_URL", "http://localhost:8081")
	
	// Auth routes
	r.Any("/api/v1/auth/*path", s.proxyHandler(authServiceURL))

	s.router = r
}

func (s *Service) healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"timestamp": time.Now().UTC(),
		"service":   "api-gateway",
	})
}

func (s *Service) proxyHandler(target string) gin.HandlerFunc {
	return func(c *gin.Context) {
		remote, err := url.Parse(target)
		if err != nil {
			s.logger.Error("failed to parse target url", zap.Error(err))
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}

		proxy := httputil.NewSingleHostReverseProxy(remote)
		proxy.Director = func(req *http.Request) {
			req.Header = c.Request.Header
			req.Host = remote.Host
			req.URL.Scheme = remote.Scheme
			req.URL.Host = remote.Host
			// req.URL.Path is already correct because we are forwarding everything
		}

		proxy.ServeHTTP(c.Writer, c.Request)
	}
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
