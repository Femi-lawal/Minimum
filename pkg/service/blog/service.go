package blog

import (
	"context"
	"database/sql"
	"fmt"
	"math/rand"
	"net"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

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

func Run() {
	// Initialize
	config := common.LoadConfig()
	if p := os.Getenv("BLOG_PORT"); p != "" {
		config.Port = p
	}
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
		logger.Fatal("failed to ping database after retries", zap.Error(err))
	}
	logger.Info("connected to database successfully")

	// Create service
	svc := &Service{
		config: config,
		logger: logger,
		db:     db,
	}

	// Run Seeding (Dev mode only for safety)
	svc.seedData()

	// Start Activity Simulation
	go svc.simulateActivity()

	// Start gRPC server
	svc.startGRPCServer()
}

func (s *Service) seedData() {
	// Only seed in development mode
	if s.config.Environment == "production" {
		s.logger.Info("Skipping seeding in production mode")
		return
	}

	// Check if data already exists to prevent destructive re-seeding
	var userCount int
	err := s.db.QueryRow("SELECT COUNT(*) FROM users").Scan(&userCount)
	if err == nil && userCount > 0 {
		s.logger.Info("Data already exists, skipping seeding", zap.Int("userCount", userCount))
		return
	}

	s.logger.Info("Starting initial data seeding...")

	// 1. Ensure tables exist
	s.logger.Info("Ensuring tables exist...")

	// Core Tables (Postgres Init should handle this but for safety/Lambda)
	// Note: In serverless, migrations usually happen externally. Here we do "ensure definitions".

	_, err = s.db.Exec(`
		CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

		CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			name VARCHAR(255) NOT NULL,
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			bio TEXT,
			avatar_url VARCHAR(255),
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		);

		CREATE TABLE IF NOT EXISTS posts (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			title VARCHAR(255) NOT NULL,
			subtitle VARCHAR(255),
			content TEXT NOT NULL,
			author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			slug VARCHAR(255) UNIQUE,
			status VARCHAR(50) DEFAULT 'draft',
			reading_time INTEGER,
			published_at TIMESTAMP WITH TIME ZONE,
			cover_image VARCHAR(255),
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		);

		CREATE TABLE IF NOT EXISTS tags (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			name VARCHAR(100) UNIQUE NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		);
		
		CREATE TABLE IF NOT EXISTS post_tags (
			post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
			tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
			PRIMARY KEY (post_id, tag_id)
		);
		
		CREATE TABLE IF NOT EXISTS comments (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			content TEXT NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		);

		CREATE TABLE IF NOT EXISTS interactions (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			type VARCHAR(50) NOT NULL,
			count INTEGER DEFAULT 1,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			UNIQUE(post_id, user_id, type)
		);

		CREATE TABLE IF NOT EXISTS follows (
			follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			followee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			PRIMARY KEY (follower_id, followee_id)
		);

		CREATE TABLE IF NOT EXISTS bookmarks (
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			PRIMARY KEY (user_id, post_id)
		);

		CREATE TABLE IF NOT EXISTS notifications (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			type VARCHAR(20) NOT NULL,
			actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			read BOOLEAN DEFAULT FALSE
		);
	`)
	if err != nil {
		// Log but don't fail, assume tables might exist
		s.logger.Warn("Table creation warning", zap.Error(err))
	}

	// 2. Insert Main User (Alice Chen)
	aliceID := "00000000-0000-0000-0000-000000000001"
	_, err = s.db.Exec(`
		INSERT INTO users (id, name, email, password_hash, bio, avatar_url, created_at, updated_at) 
		VALUES ($1, 'Alice Chen', 'alice@example.com', 'hashed_placeholder', 'Senior Software Engineer | Tech Enthusiast.', 'https://ui-avatars.com/api/?name=Alice+Chen&background=0D8ABC&color=fff', NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
	`, aliceID)
	if err != nil {
		s.logger.Fatal("failed to seed Alice", zap.Error(err))
	}

	// 3. Generate 40 Users
	firstNames := []string{"James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"}
	lastNames := []string{"Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"}
	titles := []string{"Product Manager", "UX Designer", "Software Engineer", "Data Scientist", "DevOps Engineer", "Tech Writer", "Startup Founder", "Cloud Architect", "Frontend Developer", "Backend Developer"}

	bgColors := []string{"1abc9c", "2ecc71", "3498db", "9b59b6", "34495e", "16a085", "27ae60", "2980b9", "8e44ad", "2c3e50", "f1c40f", "e67e22", "e74c3c", "ecf0f1", "95a5a6", "f39c12", "d35400", "c0392b", "bdc3c7", "7f8c8d"}

	var userIDs []string

	for i := 0; i < 40; i++ {
		fn := firstNames[rand.Intn(len(firstNames))]
		ln := lastNames[rand.Intn(len(lastNames))]
		name := fmt.Sprintf("%s %s", fn, ln)
		title := titles[rand.Intn(len(titles))]
		bio := fmt.Sprintf("%s at TechCorp. Passionate about innovation and coffee.", title)
		email := fmt.Sprintf("%s.%s%d@example.com", fn, ln, i)
		color := bgColors[rand.Intn(len(bgColors))]
		avatar := fmt.Sprintf("https://ui-avatars.com/api/?name=%s+%s&background=%s&color=fff", fn, ln, color)

		var id string
		err := s.db.QueryRow(`
			INSERT INTO users (name, email, password_hash, bio, avatar_url, created_at, updated_at)
			VALUES ($1, $2, 'hashed_placeholder', $3, $4, NOW(), NOW())
			RETURNING id
		`, name, email, bio, avatar).Scan(&id)

		if err != nil {
			s.logger.Error("failed to create user", zap.String("name", name), zap.Error(err))
			continue
		}
		userIDs = append(userIDs, id)
	}

	// 4. Generate Posts
	topics := []string{"Programming", "Technology", "Design", "Productivity", "Writing", "Self Improvement"}

	// Create Tags first
	var tagIDs = make(map[string]string)
	for _, t := range topics {
		var tid string
		err := s.db.QueryRow(`INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`, t).Scan(&tid)
		if err != nil {
			s.logger.Error("failed to create/get tag", zap.String("tag", t), zap.Error(err))
		} else {
			tagIDs[t] = tid
			s.logger.Info("created/got tag", zap.String("tag", t), zap.String("id", tid))
		}
	}

	titlesList := []string{
		"The Future of AI is Here",
		"Why I Switched to Go",
		"10 Tips for Better UX",
		"How to Be More Productive",
		"The Art of Minimalist Design",
		"Understanding Microservices",
		"My Journey into Tech",
		"SaaS Metrics You Should Know",
		"Remote Work Best Practices",
		"Kubernetes for Beginners",
		"React Server Components Explained",
		"The Death of the Cookies",
		"Web3: Hype or Reality?",
		"Designing for Accessibility",
		"Mastering SQL Joins",
	}

	contents := []string{
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
		"Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
		"Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
	}

	// Add posts for Alice
	userIDs = append([]string{aliceID}, userIDs...)

	for _, uid := range userIDs {
		// Each user gets 3-7 posts
		postCount := rand.Intn(5) + 3
		for j := 0; j < postCount; j++ {
			topic := topics[rand.Intn(len(topics))]
			title := titlesList[rand.Intn(len(titlesList))]
			content := contents[rand.Intn(len(contents))]

			// Slightly randomize title
			if rand.Intn(2) == 0 {
				title = fmt.Sprintf("%s (%s Edition)", title, topic)
			}

			// Insert Post
			var pid string
			err := s.db.QueryRow(`
				INSERT INTO posts (title, content, author_id, status, reading_time, published_at, created_at, updated_at)
				VALUES ($1, $2, $3, 'published', $4, NOW(), NOW(), NOW())
				RETURNING id
			`, title, content, uid, rand.Intn(10)+2).Scan(&pid)

			if err != nil {
				continue
			}

			// Link Tag
			if tid, ok := tagIDs[topic]; ok {
				_, _ = s.db.Exec(`INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2)`, pid, tid)
			}
		}
	}

	s.logger.Info("Data seeding complete.")
}

func (s *Service) simulateActivity() {
	s.logger.Info("Starting activity simulation...")

	// Get all user IDs (excluding Alice)
	aliceID := "00000000-0000-0000-0000-000000000001"

	for {
		time.Sleep(10 * time.Second)

		// Pick random user
		var randomUserID string
		err := s.db.QueryRow("SELECT id FROM users WHERE id != $1 ORDER BY RANDOM() LIMIT 1", aliceID).Scan(&randomUserID)
		if err != nil {
			s.logger.Error("failed to pick random user", zap.Error(err))
			continue
		}

		// Check if following
		var exists bool
		err = s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND followee_id = $2)", randomUserID, aliceID).Scan(&exists)

		if exists {
			// Unfollow
			_, err = s.db.Exec("DELETE FROM follows WHERE follower_id = $1 AND followee_id = $2", randomUserID, aliceID)
			s.logger.Info("Simulated Unfollow", zap.String("user", randomUserID))
		} else {
			// Follow
			_, err = s.db.Exec("INSERT INTO follows (follower_id, followee_id, created_at) VALUES ($1, $2, NOW())", randomUserID, aliceID)
			s.logger.Info("Simulated Follow", zap.String("user", randomUserID))
		}
	}
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

func (s *Service) ListPosts(ctx context.Context, req *pb.ListPostsRequest) (*pb.ListPostsResponse, error) {
	defer func() {
		if r := recover(); r != nil {
			s.logger.Error("PANIC in ListPosts", zap.Any("panic", r))
		}
	}()
	s.logger.Info("ListPosts called", zap.String("user_id", req.CurrentUserId), zap.String("search", req.SearchQuery))

	// Handle current user ID being empty
	var currentUserID interface{}
	if req.CurrentUserId != "" {
		currentUserID = req.CurrentUserId
	}

	// Base query with Claps Count
	query := `
		SELECT DISTINCT p.id, p.title, p.subtitle, p.content, p.author_id, p.created_at, p.reading_time,
		       u.name as author_name, u.avatar_url, p.published_at,
			   (SELECT COUNT(*) FROM interactions WHERE post_id = p.id AND type = 'clap') as claps_count,
			   EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = $1::uuid) as is_bookmarked,
			   COALESCE((
				SELECT string_agg(t.name, ',')
				FROM post_tags pt
				JOIN tags t ON pt.tag_id = t.id
				WHERE pt.post_id = p.id
			   ), '') as tags
		FROM posts p
		LEFT JOIN users u ON p.author_id = u.id
	`
	var args []interface{}
	args = append(args, currentUserID) // $1 can be UUID or nil
	argCount := 2

	if req.Tag != "" {
		query += `
			JOIN post_tags pt ON p.id = pt.post_id
			JOIN tags t ON pt.tag_id = t.id
		`
	}

	query += " WHERE p.status = 'published'"

	if req.Tag != "" {
		args = append(args, req.Tag)
		query += fmt.Sprintf(" AND t.name = $%d", argCount)
		argCount++
	}

	// Full-text search on title and content
	if req.SearchQuery != "" {
		args = append(args, "%"+req.SearchQuery+"%")
		query += fmt.Sprintf(" AND (p.title ILIKE $%d OR p.content ILIKE $%d)", argCount, argCount)
		argCount++
	}

	// Add pagination
	limit := int(req.Limit)
	if limit <= 0 || limit > 100 {
		limit = 10
	}
	offset := int(req.Page-1) * limit
	if offset < 0 {
		offset = 0
	}
	args = append(args, limit, offset)
	query += fmt.Sprintf(" ORDER BY p.published_at DESC LIMIT $%d OFFSET $%d", argCount, argCount+1)

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
		var clapsCount int32

		var createdAt sql.NullTime
		var tagsBytes []byte

		err := rows.Scan(
			&post.Id,
			&post.Title,
			&subtitle,
			&post.Content,
			&post.AuthorId,
			&createdAt,
			&readingTime,
			&authorName,
			&avatarURL,
			&publishedAt,
			&clapsCount,
			&post.IsBookmarked,
			&tagsBytes,
		)
		if err != nil {
			s.logger.Error("failed to scan post", zap.Error(err))
			continue
		}

		if createdAt.Valid {
			post.CreatedAt = createdAt.Time.Format(time.RFC3339)
		}

		// Parse tags
		tagsString := string(tagsBytes)
		if tagsString != "" {
			post.Tags = strings.Split(tagsString, ",")
		} else {
			post.Tags = []string{}
		}

		post.ClapsCount = clapsCount

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
	s.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM follows WHERE followee_id = $1", req.Id).Scan(&user.Followers)
	s.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM follows WHERE follower_id = $1", req.Id).Scan(&user.Following)

	// Check IsFollowing if CurrentUserId provided
	if req.CurrentUserId != "" && req.CurrentUserId != req.Id {
		var isFollowing bool
		s.db.QueryRowContext(ctx, "SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND followee_id = $2)", req.CurrentUserId, req.Id).Scan(&isFollowing)
		user.IsFollowing = isFollowing
	}

	return &pb.GetUserResponse{
		User: &user,
	}, nil
}

func (s *Service) CreatePost(ctx context.Context, req *pb.CreatePostRequest) (*pb.CreatePostResponse, error) {
	s.logger.Info("CreatePost request", zap.String("title", req.Title))

	// Insert post into database
	query := `
		INSERT INTO posts (author_id, title, content, cover_image, status, published_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'published', NOW(), NOW(), NOW())
		RETURNING id, created_at
	`

	var post pb.Post
	err := s.db.QueryRowContext(ctx, query, req.AuthorId, req.Title, req.Content, req.CoverImage).Scan(&post.Id, &post.CreatedAt)
	if err != nil {
		s.logger.Error("failed to create post", zap.Error(err))
		return nil, err
	}

	post.Title = req.Title
	post.Content = req.Content
	post.AuthorId = req.AuthorId
	post.CoverImage = req.CoverImage

	// Handle Tags
	var savedTags []string
	for _, tagName := range req.Tags {
		var tagID string
		// Create or Get Tag
		err := s.db.QueryRowContext(ctx,
			"INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id",
			tagName).Scan(&tagID)
		if err != nil {
			s.logger.Error("failed to process tag", zap.String("tag", tagName), zap.Error(err))
			continue
		}

		// Link Tag to Post
		_, err = s.db.ExecContext(ctx,
			"INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
			post.Id, tagID)
		if err != nil {
			s.logger.Error("failed to link tag", zap.String("tag", tagName), zap.Error(err))
			continue
		}
		savedTags = append(savedTags, tagName)
	}
	post.Tags = savedTags

	s.logger.Info("created post", zap.String("id", post.Id))

	return &pb.CreatePostResponse{
		Post: &post,
	}, nil
}

func (s *Service) ToggleClap(ctx context.Context, req *pb.ToggleClapRequest) (*pb.ToggleClapResponse, error) {
	s.logger.Info("ToggleClap request", zap.String("post_id", req.PostId), zap.String("user_id", req.UserId))

	// Check current state (we implement as LIKE toggle: if exists, delete; else insert 1 clap)
	// Medium clap is additive, but schema UNIQUE(post_id, user_id, type) forces singular Clap per user unless we update count.
	// For now, simple Like Toggle.

	var exists bool
	err := s.db.QueryRowContext(ctx,
		"SELECT EXISTS(SELECT 1 FROM interactions WHERE post_id = $1 AND user_id = $2 AND type = 'clap')",
		req.PostId, req.UserId).Scan(&exists)
	if err != nil {
		s.logger.Error("failed to check clap", zap.Error(err))
		return nil, err
	}

	if exists {
		// Remove clap
		_, err = s.db.ExecContext(ctx,
			"DELETE FROM interactions WHERE post_id = $1 AND user_id = $2 AND type = 'clap'",
			req.PostId, req.UserId)
		if err != nil {
			s.logger.Error("failed to remove clap", zap.Error(err))
			return nil, err
		}
	} else {
		// Add clap
		_, err = s.db.ExecContext(ctx,
			"INSERT INTO interactions (post_id, user_id, type, count) VALUES ($1, $2, 'clap', 1)",
			req.PostId, req.UserId)
		if err != nil {
			s.logger.Error("failed to add clap", zap.Error(err))
			return nil, err
		}
	}

	// Notification Logic
	if !exists && req.PostId != "" {
		// Get post author
		var authorID string
		err := s.db.QueryRowContext(ctx, "SELECT author_id FROM posts WHERE id = $1", req.PostId).Scan(&authorID)
		if err == nil && authorID != req.UserId {
			// Create notification
			s.db.ExecContext(ctx, `
				INSERT INTO notifications (user_id, type, actor_id, post_id, created_at)
				VALUES ($1, 'clap', $2, $3, NOW())
			`, authorID, req.UserId, req.PostId)
		}
	}

	// Get total Claps
	var totalClaps int32
	// Sum of counts (since count defaults to 1)
	err = s.db.QueryRowContext(ctx,
		"SELECT COALESCE(SUM(count), 0) FROM interactions WHERE post_id = $1 AND type = 'clap'",
		req.PostId).Scan(&totalClaps)
	if err != nil {
		s.logger.Error("failed to count claps", zap.Error(err))
		return nil, err
	}

	return &pb.ToggleClapResponse{
		Clapped:    !exists,
		ClapsCount: totalClaps,
	}, nil
}

// Post Management RPCs

func (s *Service) GetPost(ctx context.Context, req *pb.GetPostRequest) (*pb.GetPostResponse, error) {
	s.logger.Info("GetPost request", zap.String("post_id", req.PostId))

	var post pb.Post
	var authorName sql.NullString
	var avatarURL sql.NullString
	var publishedAt sql.NullTime
	var coverImage sql.NullString

	query := `
		SELECT p.id, p.title, p.content, p.author_id, p.created_at, p.cover_image,
		       u.name, u.avatar_url, p.published_at,
		       COALESCE((SELECT SUM(count) FROM interactions WHERE post_id = p.id AND type = 'clap'), 0) as claps_count
		FROM posts p
		JOIN users u ON p.author_id = u.id
		WHERE p.id = $1
	`

	err := s.db.QueryRowContext(ctx, query, req.PostId).Scan(
		&post.Id, &post.Title, &post.Content, &post.AuthorId, &post.CreatedAt, &coverImage,
		&authorName, &avatarURL, &publishedAt, &post.ClapsCount,
	)

	if err != nil {
		s.logger.Error("failed to get post", zap.Error(err))
		return nil, err
	}

	if coverImage.Valid {
		post.CoverImage = coverImage.String
	}

	post.Author = &pb.Author{
		Id:   post.AuthorId,
		Name: authorName.String,
	}
	if avatarURL.Valid {
		post.Author.AvatarUrl = avatarURL.String
	}

	// Get tags
	tagRows, _ := s.db.QueryContext(ctx, `
		SELECT t.name FROM tags t
		JOIN post_tags pt ON t.id = pt.tag_id
		WHERE pt.post_id = $1
	`, req.PostId)
	if tagRows != nil {
		defer tagRows.Close()
		for tagRows.Next() {
			var tag string
			if err := tagRows.Scan(&tag); err == nil {
				post.Tags = append(post.Tags, tag)
			}
		}
	}

	return &pb.GetPostResponse{Post: &post}, nil
}

func (s *Service) UpdatePost(ctx context.Context, req *pb.UpdatePostRequest) (*pb.UpdatePostResponse, error) {
	s.logger.Info("UpdatePost request", zap.String("post_id", req.PostId), zap.String("user_id", req.UserId))

	// Check ownership
	var authorID string
	err := s.db.QueryRowContext(ctx, "SELECT author_id FROM posts WHERE id = $1", req.PostId).Scan(&authorID)
	if err != nil {
		return nil, fmt.Errorf("post not found")
	}

	if authorID != req.UserId {
		return nil, fmt.Errorf("unauthorized: only the author can edit this post")
	}

	// Update post
	_, err = s.db.ExecContext(ctx, `
		UPDATE posts 
		SET title = $1, content = $2, cover_image = $3, updated_at = NOW()
		WHERE id = $4
	`, req.Title, req.Content, req.CoverImage, req.PostId)

	if err != nil {
		s.logger.Error("failed to update post", zap.Error(err))
		return nil, err
	}

	// Update tags: delete existing and re-insert
	s.db.ExecContext(ctx, "DELETE FROM post_tags WHERE post_id = $1", req.PostId)

	for _, tagName := range req.Tags {
		var tagID string
		err := s.db.QueryRowContext(ctx, `
			INSERT INTO tags (name) VALUES ($1)
			ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
			RETURNING id
		`, tagName).Scan(&tagID)
		if err == nil {
			s.db.ExecContext(ctx, "INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", req.PostId, tagID)
		}
	}

	// Return updated post
	getResp, err := s.GetPost(ctx, &pb.GetPostRequest{PostId: req.PostId})
	if err != nil {
		return nil, err
	}

	return &pb.UpdatePostResponse{Post: getResp.Post}, nil
}

func (s *Service) DeletePost(ctx context.Context, req *pb.DeletePostRequest) (*pb.DeletePostResponse, error) {
	s.logger.Info("DeletePost request", zap.String("post_id", req.PostId), zap.String("user_id", req.UserId))

	// Check ownership
	var authorID string
	err := s.db.QueryRowContext(ctx, "SELECT author_id FROM posts WHERE id = $1", req.PostId).Scan(&authorID)
	if err != nil {
		return nil, fmt.Errorf("post not found")
	}

	if authorID != req.UserId {
		return nil, fmt.Errorf("unauthorized: only the author can delete this post")
	}

	// Delete post (cascades to comments, interactions, bookmarks, post_tags)
	_, err = s.db.ExecContext(ctx, "DELETE FROM posts WHERE id = $1", req.PostId)
	if err != nil {
		s.logger.Error("failed to delete post", zap.Error(err))
		return nil, err
	}

	return &pb.DeletePostResponse{Success: true}, nil
}

// Comments RPCs

func (s *Service) CreateComment(ctx context.Context, req *pb.CreateCommentRequest) (*pb.CreateCommentResponse, error) {
	s.logger.Info("CreateComment request", zap.String("post_id", req.PostId), zap.String("user_id", req.UserId))

	var commentID string
	var createdAt time.Time
	var content string

	// Insert Comment
	err := s.db.QueryRowContext(ctx, `
		INSERT INTO comments (post_id, user_id, content, created_at)
		VALUES ($1, $2, $3, NOW())
		RETURNING id, created_at, content
	`, req.PostId, req.UserId, req.Content).Scan(&commentID, &createdAt, &content)

	if err != nil {
		s.logger.Error("failed to create comment", zap.Error(err))
		return nil, err
	}

	// Notification Logic (Notify Post Author)
	var authorID string
	err = s.db.QueryRowContext(ctx, "SELECT author_id FROM posts WHERE id = $1", req.PostId).Scan(&authorID)
	if err == nil && authorID != req.UserId {
		// Create notification
		s.db.ExecContext(ctx, `
			INSERT INTO notifications (user_id, type, actor_id, post_id, created_at)
			VALUES ($1, 'comment', $2, $3, NOW())
		`, authorID, req.UserId, req.PostId)
	}

	// Fetch Author Details for response
	var author pb.User
	var bio sql.NullString
	var avatarURL sql.NullString
	err = s.db.QueryRowContext(ctx, "SELECT id, name, email, bio, avatar_url FROM users WHERE id = $1", req.UserId).Scan(
		&author.Id, &author.Name, &author.Email, &bio, &avatarURL,
	)
	if bio.Valid {
		author.Bio = bio.String
	}
	if avatarURL.Valid {
		author.AvatarUrl = avatarURL.String
	}

	return &pb.CreateCommentResponse{
		Comment: &pb.Comment{
			Id:        commentID,
			PostId:    req.PostId,
			UserId:    req.UserId,
			Content:   content,
			CreatedAt: createdAt.Format(time.RFC3339),
			Author:    &author,
		},
	}, nil
}

func (s *Service) ListComments(ctx context.Context, req *pb.ListCommentsRequest) (*pb.ListCommentsResponse, error) {
	offset := (req.Page - 1) * req.Limit

	query := `
		SELECT c.id, c.post_id, c.user_id, c.content, c.created_at,
		       u.name, u.avatar_url
		FROM comments c
		JOIN users u ON c.user_id = u.id
		WHERE c.post_id = $1
		ORDER BY c.created_at ASC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.QueryContext(ctx, query, req.PostId, req.Limit, offset)
	if err != nil {
		s.logger.Error("failed to list comments", zap.Error(err))
		return nil, err
	}
	defer rows.Close()

	var comments []*pb.Comment
	for rows.Next() {
		var c pb.Comment
		var authorName, authorAvatar sql.NullString
		var createdAt time.Time

		if err := rows.Scan(&c.Id, &c.PostId, &c.UserId, &c.Content, &createdAt, &authorName, &authorAvatar); err != nil {
			continue
		}

		c.CreatedAt = createdAt.Format(time.RFC3339)
		c.Author = &pb.User{
			Id: c.UserId,
		}
		if authorName.Valid {
			c.Author.Name = authorName.String
		}
		if authorAvatar.Valid {
			c.Author.AvatarUrl = authorAvatar.String
		}

		comments = append(comments, &c)
	}

	var total int32
	s.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM comments WHERE post_id = $1", req.PostId).Scan(&total)

	return &pb.ListCommentsResponse{
		Comments: comments,
		Total:    total,
	}, nil
}

func (s *Service) DeleteComment(ctx context.Context, req *pb.DeleteCommentRequest) (*pb.DeleteCommentResponse, error) {
	// Check ownership or post ownership
	var commentUserID, postAuthorID string
	err := s.db.QueryRowContext(ctx, `
		SELECT c.user_id, p.author_id 
		FROM comments c 
		JOIN posts p ON c.post_id = p.id 
		WHERE c.id = $1
	`, req.CommentId).Scan(&commentUserID, &postAuthorID)

	if err != nil {
		return nil, fmt.Errorf("comment not found")
	}

	if req.UserId != commentUserID && req.UserId != postAuthorID {
		return nil, fmt.Errorf("unauthorized")
	}

	_, err = s.db.ExecContext(ctx, "DELETE FROM comments WHERE id = $1", req.CommentId)
	if err != nil {
		return nil, err
	}

	return &pb.DeleteCommentResponse{Success: true}, nil
}

func (s *Service) ToggleFollow(ctx context.Context, req *pb.ToggleFollowRequest) (*pb.ToggleFollowResponse, error) {
	s.logger.Info("ToggleFollow request", zap.String("follower", req.FollowerId), zap.String("followee", req.FolloweeId))

	if req.FollowerId == req.FolloweeId {
		return &pb.ToggleFollowResponse{Following: false}, nil // Cannot follow self
	}

	var exists bool
	err := s.db.QueryRowContext(ctx,
		"SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND followee_id = $2)",
		req.FollowerId, req.FolloweeId).Scan(&exists)
	if err != nil {
		return nil, err
	}

	if exists {
		// Unfollow
		_, err = s.db.ExecContext(ctx, "DELETE FROM follows WHERE follower_id = $1 AND followee_id = $2", req.FollowerId, req.FolloweeId)
		if err != nil {
			return nil, err
		}
	} else {
		// Follow
		_, err = s.db.ExecContext(ctx, "INSERT INTO follows (follower_id, followee_id) VALUES ($1, $2)", req.FollowerId, req.FolloweeId)
		if err != nil {
			return nil, err
		}
	}

	// Notification Logic
	if !exists {
		// Create notification
		s.db.ExecContext(ctx, `
			INSERT INTO notifications (user_id, type, actor_id, created_at)
			VALUES ($1, 'follow', $2, NOW())
		`, req.FolloweeId, req.FollowerId)
	}

	return &pb.ToggleFollowResponse{
		Following: !exists,
	}, nil
}

func (s *Service) ToggleBookmark(ctx context.Context, req *pb.ToggleBookmarkRequest) (*pb.ToggleBookmarkResponse, error) {
	s.logger.Info("ToggleBookmark request", zap.String("post_id", req.PostId), zap.String("user_id", req.UserId))

	var exists bool
	err := s.db.QueryRowContext(ctx,
		"SELECT EXISTS(SELECT 1 FROM bookmarks WHERE post_id = $1 AND user_id = $2)",
		req.PostId, req.UserId).Scan(&exists)
	if err != nil {
		s.logger.Error("failed to check bookmark", zap.Error(err))
		return nil, err
	}

	if exists {
		// Remove bookmark
		_, err = s.db.ExecContext(ctx, "DELETE FROM bookmarks WHERE post_id = $1 AND user_id = $2", req.PostId, req.UserId)
		if err != nil {
			s.logger.Error("failed to remove bookmark", zap.Error(err))
			return nil, err
		}
	} else {
		// Add bookmark
		_, err = s.db.ExecContext(ctx, "INSERT INTO bookmarks (post_id, user_id) VALUES ($1, $2)", req.PostId, req.UserId)
		if err != nil {
			s.logger.Error("failed to add bookmark", zap.Error(err))
			return nil, err
		}
	}

	return &pb.ToggleBookmarkResponse{
		Bookmarked: !exists,
	}, nil
}

func (s *Service) ListNotifications(ctx context.Context, req *pb.ListNotificationsRequest) (*pb.ListNotificationsResponse, error) {
	// Query notifications with actor and post details
	query := `
		SELECT n.id, n.user_id, n.type, n.actor_id, n.post_id, n.created_at, n.read,
		       u.name, u.avatar_url,
		       COALESCE(p.title, '') as post_title
		FROM notifications n
		JOIN users u ON n.actor_id = u.id
		LEFT JOIN posts p ON n.post_id = p.id
		WHERE n.user_id = $1
		ORDER BY n.created_at DESC
		LIMIT $2 OFFSET $3
	`
	offset := (req.Page - 1) * req.Limit
	rows, err := s.db.QueryContext(ctx, query, req.UserId, req.Limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []*pb.Notification
	for rows.Next() {
		var n pb.Notification
		var postID sql.NullString
		var postTitle sql.NullString

		err := rows.Scan(
			&n.Id, &n.UserId, &n.Type, &n.ActorId, &postID, &n.CreatedAt, &n.Read,
			&n.ActorName, &n.ActorAvatarUrl,
			&postTitle,
		)
		if err != nil {
			continue
		}
		if postID.Valid {
			n.PostId = postID.String
		}
		if postTitle.Valid {
			n.PostTitle = postTitle.String
		}
		notifications = append(notifications, &n)
	}

	// Count total and unread
	var total int32
	s.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM notifications WHERE user_id = $1", req.UserId).Scan(&total)

	var unread int32
	s.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = FALSE", req.UserId).Scan(&unread)

	return &pb.ListNotificationsResponse{
		Notifications: notifications,
		Total:         total,
		UnreadCount:   unread,
	}, nil
}

func (s *Service) MarkNotificationRead(ctx context.Context, req *pb.MarkNotificationReadRequest) (*pb.MarkNotificationReadResponse, error) {
	_, err := s.db.ExecContext(ctx, "UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2", req.NotificationId, req.UserId)
	if err != nil {
		return nil, err
	}
	return &pb.MarkNotificationReadResponse{Success: true}, nil
}
