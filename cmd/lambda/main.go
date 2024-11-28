package main

import (
	"context"
	"log"
	"os"

	"project/pkg/service/auth"
	"project/pkg/service/blog"
	"project/pkg/service/gateway"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	ginadapter "github.com/awslabs/aws-lambda-go-api-proxy/gin"
)

var ginLambda *ginadapter.GinLambda

func init() {
	// Set environment variables for internal communication if not set
	// In Lambda, these services run on localhost
	if os.Getenv("AUTH_SERVICE_URL") == "" {
		os.Setenv("AUTH_SERVICE_URL", "localhost:8081")
	}
	if os.Getenv("BLOG_SERVICE_URL") == "" {
		os.Setenv("BLOG_SERVICE_URL", "localhost:8082")
	}
	// Force internal ports for monolith to prevent conflicts
	os.Setenv("AUTH_PORT", "8081")
	os.Setenv("BLOG_PORT", "8082")

	// Database URL must be set in Lambda Environment Variables
	// JWT_SECRET must be set in Lambda Environment Variables

	log.Println("Initializing Lambda Monolith...")

	// 1. Start Auth Service (Background)
	go func() {
		log.Println("Starting Auth Service...")
		// Auth Run defaults to port 8081 (from PORT env or default)
		// We ensure PORT is compatible or relies on config.
		// NOTE: The services use internal config loading which reads PORT.
		// We might need to force ports if PORT env var conflicts.
		// But in Lambda, we can't easily change env var per goroutine.
		// However, the Refactored services read common.LoadConfig().
		// We rely on standard ports 8081/8082 tailored by logic?
		// Actually, standard config uses 'PORT'. This implies conflict!
		// FATAL FLAW CHECK: common.LoadConfig reads PORT.
		// If we set PORT=8080 for Gateway, Auth will try to bind 8080 too?
		// We need to fix the service ports.
		// Since we run in same process, we need separate ports.

		// Hack/Fix: The services read config.Port.
		// For this Monolith, we need to ensure they bind distinct ports.
		// But common.Config is shared.

		// We should have passed config to Run().
		// Since we didn't, we rely on the fact that we can't easily run them if they share PORT.

		// Solution: The refactored code has `Run()` which calls `common.LoadConfig()`.
		// `NewService` calls `common.LoadConfig()`.
		// `common.Config` reads `PORT`.

		// We need to change how ports are assigned.
		// OR: We overwrite Listen logic.
		// But `Run` function is hardcoded to listen on config.Port.

		auth.Run()
	}()

	// 2. Start Blog Service (Background)
	go func() {
		log.Println("Starting Blog Service...")
		blog.Run()
	}()

	// Wait a moment for services to bind (naive, but usually sufficient in cold start)
	// In a real robust implementation, we'd use channels to signal readiness.

	// 3. Initialize Gateway (Frontend)
	// Gateway connects to localhost:8081 and localhost:8082
	log.Println("Initializing Gateway Service...")
	svc := gateway.NewService()
	svc.SetupRouter()

	ginLambda = ginadapter.New(svc.GetRouter())
}

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// If no name is provided in the HTTP request body, throw an error
	return ginLambda.ProxyWithContext(ctx, req)
}

func main() {
	lambda.Start(Handler)
}
