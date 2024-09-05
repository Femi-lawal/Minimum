package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"google.golang.org/grpc"

	authpb "project/pkg/proto/auth"
)

// AuthMiddleware validates JWT tokens using the auth service
func AuthMiddleware(authClient authpb.AuthServiceClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "UNAUTHORIZED",
					"message": "Authorization header required",
				},
			})
			return
		}

		// Extract Bearer token
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "INVALID_TOKEN",
					"message": "Invalid authorization header format",
				},
			})
			return
		}
		token := parts[1]

		// Validate token with auth service
		resp, err := authClient.Validate(c.Request.Context(), &authpb.ValidateRequest{
			Token: token,
		})
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "AUTH_SERVICE_ERROR",
					"message": "Failed to validate token",
				},
			})
			return
		}

		if !resp.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "INVALID_TOKEN",
					"message": "Token is invalid or expired",
				},
			})
			return
		}

		// Set user ID in context for downstream handlers
		c.Set("userId", resp.UserId)
		c.Next()
	}
}

// OptionalAuthMiddleware extracts user ID if token present, but doesn't require it
func OptionalAuthMiddleware(authClient authpb.AuthServiceClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.Next()
			return
		}
		token := parts[1]

		resp, err := authClient.Validate(c.Request.Context(), &authpb.ValidateRequest{
			Token: token,
		})
		if err == nil && resp.Valid {
			c.Set("userId", resp.UserId)
		}

		c.Next()
	}
}

// GetUserID retrieves the user ID from context, returns empty string if not authenticated
func GetUserID(c *gin.Context) string {
	if userId, exists := c.Get("userId"); exists {
		if id, ok := userId.(string); ok {
			return id
		}
	}
	return ""
}

// NewAuthClient creates a new auth service client
func NewAuthClient(conn *grpc.ClientConn) authpb.AuthServiceClient {
	return authpb.NewAuthServiceClient(conn)
}
