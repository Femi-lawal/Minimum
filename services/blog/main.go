package main

import (
	"context"
	"database/sql"
	"net"
	"os"
	"os/signal"
	"syscall"

	_ "github.com/lib/pq"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	"project/pkg/common"
	pb "project/pkg/proto/blog"
)

type Service struct {
	pb.UnimplementedBlogServiceServer
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
		dbURL = "postgresql://postgres:postgres@postgres:5432/blog_app?sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		logger.Fatal("failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		logger.Fatal("failed to ping database", zap.Error(err))
	}
	logger.Info("connected to database successfully")

	// Create service
	svc := &Service{
		config: config,
		logger: logger,
		db:     db,
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
	pb.RegisterBlogServiceServer(grpcServer, s)

	// Register reflection service on gRPC server
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

	// Seed default user to prevent FK errors
	_, _ = s.db.Exec(`
		INSERT INTO users (id, name, email, bio, avatar_url, created_at, updated_at) 
		VALUES ('1', 'Demo User', 'demo@example.com', 'A passionate writer.', 'https://ui-avatars.com/api/?name=Demo+User&background=random', NOW(), NOW())
		ON CONFLICT (id) DO NOTHING
	`)

	// Base query
	query := `
		SELECT p.id, p.title, p.subtitle, p.content, p.author_id, p.created_at, p.reading_time,
		       u.name as author_name, u.avatar_url, p.published_at
		FROM posts p
		LEFT JOIN users u ON p.author_id = u.id
	`
	
	var args []interface{}
	argCount := 0

	// Add filters
	whereClauses := []string{"p.status = 'published'"}
	
	if req.Tag != "" {
		query += `
			JOIN post_tags pt ON p.id = pt.post_id
			JOIN tags t ON pt.tag_id = t.id
		`
		argCount++
		whereClauses = append(whereClauses, "t.name = $"+string(rune('0'+argCount)))
		args = append(args, req.Tag)
	}

	// Combine WHERE clauses
	if len(whereClauses) > 0 {
		query += " WHERE " + whereClauses[0]
		for i := 1; i < len(whereClauses); i++ {
			query += " AND " + whereClauses[i]
		}
	}

	query += " ORDER BY p.published_at DESC LIMIT 100"

	// Reset query and do it cleanly (using the cleaner logic from before)
	query = `
		SELECT DISTINCT p.id, p.title, p.subtitle, p.content, p.author_id, p.created_at, p.reading_time,
		       u.name as author_name, u.avatar_url, p.published_at
		FROM posts p
		LEFT JOIN users u ON p.author_id = u.id
	`
	args = []interface{}{}
	
	if req.Tag != "" {
		query += `
			JOIN post_tags pt ON p.id = pt.post_id
			JOIN tags t ON pt.tag_id = t.id
		`
	}

	query += " WHERE p.status = 'published'"

	if req.Tag != "" {
		args = append(args, req.Tag)
		query += " AND t.name = $1"
	}

	query += " ORDER BY p.published_at DESC LIMIT 100"

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		s.logger.Error("failed to query posts", zap.Error(err))
		return nil, err
	}
	defer rows.Close()

	var posts []*pb.Post
	for rows.Next() {
		var post pb.Post
		var authorName sql.NullString
		var avatarURL sql.NullString
		var subtitle sql.NullString
		var readingTime sql.NullInt32
		var publishedAt sql.NullTime

		err := rows.Scan(
			&post.Id,
			&post.Title,
			&subtitle,
			&post.Content,
			&post.AuthorId,
			&post.CreatedAt,
			&readingTime,
			&authorName,
			&avatarURL,
			&publishedAt,
		)
		if err != nil {
			s.logger.Error("failed to scan post", zap.Error(err))
			continue
		}

		// Set optional fields logic
		if subtitle.Valid && subtitle.String != "" {
			post.Content = subtitle.String
		}

		// Map Author
		post.Author = &pb.Author{
			Id: post.AuthorId,
		}
		if authorName.Valid {
			post.Author.Name = authorName.String
		}
		if avatarURL.Valid {
			post.Author.AvatarUrl = avatarURL.String
		}

		posts = append(posts, &post)
	}

	return &pb.ListPostsResponse{
		Posts: posts,
		Total: int32(len(posts)),
	}, nil
}

func (s *Service) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.GetUserResponse, error) {
	s.logger.Info("GetUser request", zap.String("id", req.Id))

	var user pb.User
	var bio sql.NullString
	var avatarURL sql.NullString

	// Get user details
	query := `SELECT id, name, email, bio, avatar_url FROM users WHERE id = $1`
	err := s.db.QueryRowContext(ctx, query, req.Id).Scan(
		&user.Id, &user.Name, &user.Email, &bio, &avatarURL,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, err // Should handle gracefully
		}
		s.logger.Error("failed to get user", zap.Error(err))
		return nil, err
	}

	if bio.Valid {
		user.Bio = bio.String
	}
	if avatarURL.Valid {
		user.AvatarUrl = avatarURL.String
	}

	// Get follower counts
	// Ideally run either separate queries or subqueries
	// For simplicity, separate queries
	
	// Followers
	s.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM follows WHERE followee_id = $1", req.Id).Scan(&user.Followers)
	
	// Following
	s.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM follows WHERE follower_id = $1", req.Id).Scan(&user.Following)

	return &pb.GetUserResponse{
		User: &user,
	}, nil
}

func (s *Service) CreatePost(ctx context.Context, req *pb.CreatePostRequest) (*pb.CreatePostResponse, error) {
	s.logger.Info("CreatePost request", zap.String("title", req.Title))

	// Insert post into database
	query := `
		INSERT INTO posts (author_id, title, content, status, published_at, created_at, updated_at)
		VALUES ($1, $2, $3, 'published', NOW(), NOW(), NOW())
		RETURNING id, created_at
	`

	var post pb.Post
	err := s.db.QueryRowContext(ctx, query, req.AuthorId, req.Title, req.Content).Scan(&post.Id, &post.CreatedAt)
	if err != nil {
		s.logger.Error("failed to create post", zap.Error(err))
		return nil, err
	}

	post.Title = req.Title
	post.Content = req.Content
	post.AuthorId = req.AuthorId

	s.logger.Info("created post", zap.String("id", post.Id))

	return &pb.CreatePostResponse{
		Post: &post,
	}, nil
}
