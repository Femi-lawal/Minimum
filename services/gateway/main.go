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
	authpb "project/pkg/proto/auth"
	blogpb "project/pkg/proto/blog"
)

type Service struct {
	config     *common.Config
	logger     *zap.Logger
	router     *gin.Engine
	authClient authpb.AuthServiceClient
	blogClient blogpb.BlogServiceClient
}

func main() {
	// Initialize
	config := common.LoadConfig()
	logger := common.NewLogger(config.Environment)

	// Connect to Auth Service via gRPC
	authServiceURL := getEnv("AUTH_SERVICE_URL", "localhost:8081")
	authConn, err := grpc.Dial(authServiceURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		logger.Fatal("did not connect to auth service", zap.Error(err))
	}
	defer authConn.Close()
	authClient := authpb.NewAuthServiceClient(authConn)

	// Connect to Blog Service via gRPC
	blogServiceURL := getEnv("BLOG_SERVICE_URL", "localhost:8082")
	blogConn, err := grpc.Dial(blogServiceURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		logger.Fatal("did not connect to blog service", zap.Error(err))
	}
	defer blogConn.Close()
	blogClient := blogpb.NewBlogServiceClient(blogConn)

	// Create service
	svc := &Service{
		config:     config,
		logger:     logger,
		authClient: authClient,
		blogClient: blogClient,
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
	api := r.Group("/api/v1")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/login", s.login)
			auth.POST("/register", s.register)
		}

		posts := api.Group("/posts")
		{
			posts.GET("", s.listPosts)
			posts.POST("", s.createPost)
		}

		users := api.Group("/users")
		{
			users.GET("/:id", s.getUser)
		}
	}

	s.router = r
}

func (s *Service) listPosts(c *gin.Context) {
	tag := c.Query("tag")
	
	resp, err := s.blogClient.ListPosts(context.Background(), &blogpb.ListPostsRequest{
		Page:  1,
		Limit: 10,
		Tag:   tag,
	})
	if err != nil {
		s.logger.Error("grpc list posts failed", zap.Error(err))
		common.RespondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch posts")
		return
	}

	common.RespondSuccess(c, resp.Posts)
}

func (s *Service) createPost(c *gin.Context) {
	var req struct {
		Title   string `json:"title"`
		Content string `json:"content"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.RespondError(c, http.StatusBadRequest, "INVALID_REQUEST", err.Error())
		return
	}

	// TODO: Get author ID from token
	authorId := "00000000-0000-0000-0000-000000000001"

	resp, err := s.blogClient.CreatePost(context.Background(), &blogpb.CreatePostRequest{
		Title:    req.Title,
		Content:  req.Content,
		AuthorId: authorId,
	})
	if err != nil {
		s.logger.Error("grpc create post failed", zap.Error(err))
		common.RespondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to create post")
		return
	}

	common.RespondCreated(c, resp.Post)
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
	resp, err := s.authClient.Login(context.Background(), &authpb.LoginRequest{
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
	resp, err := s.authClient.Register(context.Background(), &authpb.RegisterRequest{
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

func (s *Service) getUser(c *gin.Context) {
	userId := c.Param("id")

	// Call Blog Service (where users are stored/managed alongside posts in this architecture)
	resp, err := s.blogClient.GetUser(context.Background(), &blogpb.GetUserRequest{
		Id: userId,
	})
	if err != nil {
		s.logger.Error("grpc get user failed", zap.Error(err))
		common.RespondError(c, http.StatusNotFound, "NOT_FOUND", "User not found")
		return
	}

	common.RespondSuccess(c, resp.User)
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
