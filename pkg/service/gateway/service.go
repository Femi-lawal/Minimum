package gateway

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"project/pkg/common"
	"project/pkg/middleware"
	authpb "project/pkg/proto/auth"
	blogpb "project/pkg/proto/blog"
	"project/pkg/validation"
	"project/pkg/ws"
)

type Service struct {
	config     *common.Config
	logger     *zap.Logger
	router     *gin.Engine
	authClient authpb.AuthServiceClient
	blogClient blogpb.BlogServiceClient
	wsHub      *ws.Hub
}

func NewService() *Service {
	// Initialize
	config := common.LoadConfig()
	logger := common.NewLogger(config.Environment)

	// Connect to Auth Service via gRPC
	authServiceURL := getEnv("AUTH_SERVICE_URL", "localhost:8081")
	authConn, err := grpc.Dial(authServiceURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		logger.Fatal("did not connect to auth service", zap.Error(err))
	}
	// Note: We don't defer close here because Service lives as long as the app
	// To be cleaner, we could add a Close() method.
	authClient := authpb.NewAuthServiceClient(authConn)

	// Connect to Blog Service via gRPC
	blogServiceURL := getEnv("BLOG_SERVICE_URL", "localhost:8082")
	blogConn, err := grpc.Dial(blogServiceURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		logger.Fatal("did not connect to blog service", zap.Error(err))
	}
	blogClient := blogpb.NewBlogServiceClient(blogConn)

	// Initialize WebSocket hub
	wsHub := ws.NewHub(logger)
	go wsHub.Run()

	return &Service{
		config:     config,
		logger:     logger,
		authClient: authClient,
		blogClient: blogClient,
		wsHub:      wsHub,
	}
}

func (s *Service) GetRouter() *gin.Engine {
	return s.router
}

func Run() {
	svc := NewService()
	svc.SetupRouter()
	svc.StartServer()
}

func (s *Service) SetupRouter() {
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()

	// Middleware
	r.Use(middleware.Logger(s.logger))
	r.Use(middleware.Recovery(s.logger))
	r.Use(middleware.CORS(s.config.AllowedOrigins))

	// Health check
	r.GET("/health", s.healthCheck)

	// WebSocket endpoint for real-time notifications
	r.GET("/ws", s.handleWebSocket)

	// Auth middleware for protected routes
	authMiddleware := middleware.AuthMiddleware(s.authClient)
	optionalAuthMiddleware := middleware.OptionalAuthMiddleware(s.authClient)

	// Rate limiters
	authRateLimiter := middleware.NewRateLimiter(10, time.Minute) // 10 requests per minute for auth
	apiRateLimiter := middleware.NewRateLimiter(100, time.Minute) // 100 requests per minute for API

	// API routes
	api := r.Group("/api/v1")
	api.Use(middleware.RateLimitMiddleware(apiRateLimiter)) // Apply rate limiting to all API routes
	{
		// Public auth routes (with stricter rate limiting)
		auth := api.Group("/auth")
		auth.Use(middleware.RateLimitMiddleware(authRateLimiter))
		{
			auth.POST("/login", s.login)
			auth.POST("/register", s.register)
		}

		// Posts routes - GET is public, POST requires auth
		posts := api.Group("/posts")
		{
			posts.GET("", optionalAuthMiddleware, s.listPosts)
			posts.GET("/:id", optionalAuthMiddleware, s.getPost)
			posts.POST("", authMiddleware, s.createPost)
			posts.PUT("/:id", authMiddleware, s.updatePost)
			posts.DELETE("/:id", authMiddleware, s.deletePost)
			posts.POST("/:id/clap", authMiddleware, s.toggleClap)
			posts.POST("/:id/bookmark", authMiddleware, s.toggleBookmark)
		}

		// User routes
		users := api.Group("/users")
		{
			users.GET("/:id", optionalAuthMiddleware, s.getUser)
			users.POST("/:id/follow", authMiddleware, s.toggleFollow)
			users.PUT("/me", authMiddleware, s.updateProfile)
		}

		// Notifications routes
		notifications := api.Group("/notifications")
		{
			notifications.GET("", authMiddleware, s.listNotifications)
			notifications.POST("/:id/read", authMiddleware, s.markNotificationRead)
		}

		// Comments routes
		// Nested under posts for RESTful structure
		posts.GET("/:id/comments", optionalAuthMiddleware, s.listComments)
		posts.POST("/:id/comments", authMiddleware, s.createComment)
		posts.DELETE("/:id/comments/:commentId", authMiddleware, s.deleteComment)
	}

	s.router = r
}

func (s *Service) listNotifications(c *gin.Context) {
	userId := middleware.GetUserID(c)
	page := 1 // TODO: Add pagination query params

	resp, err := s.blogClient.ListNotifications(context.Background(), &blogpb.ListNotificationsRequest{
		UserId: userId,
		Page:   int32(page),
		Limit:  20,
	})
	if err != nil {
		s.logger.Error("grpc list notifications failed", zap.Error(err))
		common.RespondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch notifications")
		return
	}

	common.RespondSuccess(c, gin.H{
		"notifications": resp.Notifications,
		"total":         resp.Total,
		"unread_count":  resp.UnreadCount,
	})
}

func (s *Service) markNotificationRead(c *gin.Context) {
	notificationId := c.Param("id")
	userId := middleware.GetUserID(c)

	_, err := s.blogClient.MarkNotificationRead(context.Background(), &blogpb.MarkNotificationReadRequest{
		NotificationId: notificationId,
		UserId:         userId,
	})
	if err != nil {
		s.logger.Error("grpc mark notification read failed", zap.Error(err))
		common.RespondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to mark notification read")
		return
	}

	common.RespondSuccess(c, gin.H{"success": true})
}

func (s *Service) listPosts(c *gin.Context) {
	tag := c.Query("tag")
	searchQuery := c.Query("q") // Full-text search
	currentUserId := middleware.GetUserID(c)

	// Parse pagination params with defaults
	page := 1
	limit := 10
	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 50 {
			limit = parsed
		}
	}

	resp, err := s.blogClient.ListPosts(context.Background(), &blogpb.ListPostsRequest{
		Page:          int32(page),
		Limit:         int32(limit),
		Tag:           tag,
		CurrentUserId: currentUserId,
		SearchQuery:   searchQuery,
	})
	if err != nil {
		s.logger.Error("grpc list posts failed", zap.Error(err))
		common.RespondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch posts")
		return
	}

	common.RespondSuccess(c, resp.Posts)
}

func (s *Service) getPost(c *gin.Context) {
	postID := c.Param("id")
	currentUserId := middleware.GetUserID(c)

	resp, err := s.blogClient.GetPost(context.Background(), &blogpb.GetPostRequest{
		PostId:        postID,
		CurrentUserId: currentUserId,
	})
	if err != nil {
		s.logger.Error("grpc get post failed", zap.Error(err))
		common.RespondError(c, http.StatusNotFound, "NOT_FOUND", "Post not found")
		return
	}

	common.RespondSuccess(c, resp.Post)
}

func (s *Service) updatePost(c *gin.Context) {
	postID := c.Param("id")
	userID := middleware.GetUserID(c)

	var req struct {
		Title      string   `json:"title"`
		Content    string   `json:"content"`
		Tags       []string `json:"tags"`
		CoverImage string   `json:"cover_image"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.RespondError(c, http.StatusBadRequest, "INVALID_REQUEST", err.Error())
		return
	}

	resp, err := s.blogClient.UpdatePost(context.Background(), &blogpb.UpdatePostRequest{
		PostId:     postID,
		UserId:     userID,
		Title:      req.Title,
		Content:    req.Content,
		Tags:       req.Tags,
		CoverImage: req.CoverImage,
	})
	if err != nil {
		s.logger.Error("grpc update post failed", zap.Error(err))
		common.RespondError(c, http.StatusForbidden, "FORBIDDEN", err.Error())
		return
	}

	common.RespondSuccess(c, resp.Post)
}

func (s *Service) deletePost(c *gin.Context) {
	postID := c.Param("id")
	userID := middleware.GetUserID(c)

	_, err := s.blogClient.DeletePost(context.Background(), &blogpb.DeletePostRequest{
		PostId: postID,
		UserId: userID,
	})
	if err != nil {
		s.logger.Error("grpc delete post failed", zap.Error(err))
		common.RespondError(c, http.StatusForbidden, "FORBIDDEN", err.Error())
		return
	}

	common.RespondSuccess(c, gin.H{"success": true})
}

func (s *Service) createPost(c *gin.Context) {
	var req struct {
		Title      string   `json:"title"`
		Content    string   `json:"content"`
		Tags       []string `json:"tags"`
		CoverImage string   `json:"cover_image"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.RespondError(c, http.StatusBadRequest, "INVALID_REQUEST", err.Error())
		return
	}

	// Get author ID from authenticated user context
	authorId := middleware.GetUserID(c)
	if authorId == "" {
		common.RespondError(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	resp, err := s.blogClient.CreatePost(context.Background(), &blogpb.CreatePostRequest{
		Title:      req.Title,
		Content:    req.Content,
		AuthorId:   authorId,
		Tags:       req.Tags,
		CoverImage: req.CoverImage,
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

	// Validate email format
	if err := validation.ValidateEmail(req.Email); err != nil {
		common.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}

	// Validate password strength
	if err := validation.ValidatePassword(req.Password); err != nil {
		common.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
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

func (s *Service) updateProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req struct {
		Name      string `json:"name"`
		Bio       string `json:"bio"`
		AvatarUrl string `json:"avatar_url"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.RespondError(c, http.StatusBadRequest, "INVALID_REQUEST", err.Error())
		return
	}

	resp, err := s.authClient.UpdateUser(context.Background(), &authpb.UpdateUserRequest{
		UserId:    userID,
		Name:      req.Name,
		Bio:       req.Bio,
		AvatarUrl: req.AvatarUrl,
	})
	if err != nil {
		s.logger.Error("grpc update user failed", zap.Error(err))
		common.RespondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update profile")
		return
	}

	common.RespondSuccess(c, gin.H{
		"id":         resp.User.Id,
		"email":      resp.User.Email,
		"name":       resp.User.Name,
		"bio":        resp.User.Bio,
		"avatar_url": resp.User.AvatarUrl,
	})
}

func (s *Service) getUser(c *gin.Context) {
	userId := c.Param("id")
	currentUserId := middleware.GetUserID(c)

	resp, err := s.blogClient.GetUser(context.Background(), &blogpb.GetUserRequest{
		Id:            userId,
		CurrentUserId: currentUserId,
	})
	if err != nil {
		s.logger.Error("grpc get user failed", zap.Error(err))
		common.RespondError(c, http.StatusNotFound, "NOT_FOUND", "User not found")
		return
	}

	common.RespondSuccess(c, resp.User)
}

func (s *Service) toggleClap(c *gin.Context) {
	postId := c.Param("id")
	userId := middleware.GetUserID(c)

	resp, err := s.blogClient.ToggleClap(context.Background(), &blogpb.ToggleClapRequest{
		PostId: postId,
		UserId: userId,
	})
	if err != nil {
		s.logger.Error("grpc toggle clap failed", zap.Error(err))
		common.RespondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to toggle clap")
		return
	}

	common.RespondSuccess(c, gin.H{
		"clapped":     resp.Clapped,
		"claps_count": resp.ClapsCount,
	})
}

func (s *Service) toggleFollow(c *gin.Context) {
	followeeId := c.Param("id")
	followerId := middleware.GetUserID(c)

	resp, err := s.blogClient.ToggleFollow(context.Background(), &blogpb.ToggleFollowRequest{
		FollowerId: followerId,
		FolloweeId: followeeId,
	})
	if err != nil {
		s.logger.Error("grpc toggle follow failed", zap.Error(err))
		common.RespondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to toggle follow")
		return
	}

	common.RespondSuccess(c, gin.H{
		"following": resp.Following,
	})
}

func (s *Service) toggleBookmark(c *gin.Context) {
	postId := c.Param("id")
	userId := middleware.GetUserID(c)

	resp, err := s.blogClient.ToggleBookmark(context.Background(), &blogpb.ToggleBookmarkRequest{
		PostId: postId,
		UserId: userId,
	})
	if err != nil {
		s.logger.Error("grpc toggle bookmark failed", zap.Error(err))
		common.RespondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to toggle bookmark")
		return
	}

	common.RespondSuccess(c, gin.H{
		"bookmarked": resp.Bookmarked,
	})
}

func (s *Service) StartServer() {
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

func (s *Service) listComments(c *gin.Context) {
	postID := c.Param("id")
	page := 1 // TODO: query param

	resp, err := s.blogClient.ListComments(context.Background(), &blogpb.ListCommentsRequest{
		PostId: postID,
		Page:   int32(page),
		Limit:  50,
	})
	if err != nil {
		s.logger.Error("grpc list comments failed", zap.Error(err))
		common.RespondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to load comments")
		return
	}

	common.RespondSuccess(c, gin.H{
		"comments": resp.Comments,
		"total":    resp.Total,
	})
}

func (s *Service) createComment(c *gin.Context) {
	postID := c.Param("id")
	userID := middleware.GetUserID(c)

	var req struct {
		Content string `json:"content"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.RespondError(c, http.StatusBadRequest, "INVALID_REQUEST", "Content is required")
		return
	}

	resp, err := s.blogClient.CreateComment(context.Background(), &blogpb.CreateCommentRequest{
		PostId:  postID,
		UserId:  userID,
		Content: req.Content,
	})
	if err != nil {
		s.logger.Error("grpc create comment failed", zap.Error(err))
		common.RespondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to post comment")
		return
	}

	common.RespondSuccess(c, resp.Comment)
}

func (s *Service) deleteComment(c *gin.Context) {
	commentID := c.Param("commentId")
	userID := middleware.GetUserID(c)

	_, err := s.blogClient.DeleteComment(context.Background(), &blogpb.DeleteCommentRequest{
		CommentId: commentID,
		UserId:    userID,
	})
	if err != nil {
		s.logger.Error("grpc delete comment failed", zap.Error(err))
		common.RespondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to delete comment")
		return
	}

	common.RespondSuccess(c, gin.H{"success": true})
}

// WebSocket upgrader with origin validation
func (s *Service) newWSUpgrader() websocket.Upgrader {
	return websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			origin := r.Header.Get("Origin")
			if origin == "" {
				return true // Allow requests without origin (e.g., same-origin)
			}
			for _, allowed := range s.config.AllowedOrigins {
				if origin == allowed {
					return true
				}
			}
			return false
		},
	}
}

func (s *Service) handleWebSocket(c *gin.Context) {
	// Get token from query param for WebSocket auth
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing token"})
		return
	}

	// Validate token
	resp, err := s.authClient.Validate(context.Background(), &authpb.ValidateRequest{Token: token})
	if err != nil || !resp.Valid {
		s.logger.Warn("WebSocket auth failed", zap.Error(err))
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	userID := resp.UserId

	// Upgrade HTTP to WebSocket
	upgrader := s.newWSUpgrader()
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		s.logger.Error("WebSocket upgrade failed", zap.Error(err))
		return
	}

	// Create client and register with hub
	client := &ws.Client{
		Hub:    s.wsHub,
		Conn:   conn,
		Send:   make(chan []byte, 256),
		UserID: userID,
	}
	s.wsHub.Register(client)

	// Start goroutines for reading and writing
	go s.wsReadPump(client)
	go s.wsWritePump(client)

	s.logger.Info("WebSocket client connected", zap.String("user_id", userID))
}

func (s *Service) wsReadPump(client *ws.Client) {
	defer func() {
		s.wsHub.Unregister(client)
		client.Conn.Close()
	}()

	client.Conn.SetReadLimit(512)
	for {
		_, _, err := client.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				s.logger.Error("WebSocket read error", zap.Error(err))
			}
			break
		}
		// Client messages could be used for heartbeat or bidirectional communication
	}
}

func (s *Service) wsWritePump(client *ws.Client) {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		client.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-client.Send:
			if !ok {
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			client.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := client.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}
		case <-ticker.C:
			client.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := client.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
