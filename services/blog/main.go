package main

import (
	"context"
	"database/sql"
	"fmt"
	"math/rand"
	"net"
	"os"
	"os/signal"
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

	// Ensure tables exist (tags and post_tags may not be created by Docker init)
	s.logger.Info("Ensuring tags and post_tags tables exist...")

	_, err = s.db.Exec(`
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
	`)
	if err != nil {
		s.logger.Error("failed to create tags tables", zap.Error(err))
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
	// Base query
	query := `
		SELECT DISTINCT p.id, p.title, p.subtitle, p.content, p.author_id, p.created_at, p.reading_time,
		       u.name as author_name, u.avatar_url, p.published_at
		FROM posts p
		LEFT JOIN users u ON p.author_id = u.id
	`
	var args []interface{}

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
	s.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM follows WHERE followee_id = $1", req.Id).Scan(&user.Followers)
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
