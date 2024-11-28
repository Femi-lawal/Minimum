package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// RateLimiter implements a simple token bucket rate limiter
type RateLimiter struct {
	tokens     map[string]*bucket
	mu         sync.RWMutex
	rate       int           // requests per window
	window     time.Duration // time window
	cleanupInt time.Duration // cleanup interval
}

type bucket struct {
	tokens    int
	lastCheck time.Time
}

// NewRateLimiter creates a new rate limiter
// rate: number of requests allowed per window
// window: duration of the window (e.g., time.Minute)
func NewRateLimiter(rate int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		tokens:     make(map[string]*bucket),
		rate:       rate,
		window:     window,
		cleanupInt: time.Minute * 5,
	}

	// Start cleanup goroutine
	go rl.cleanup()

	return rl
}

// cleanup removes stale entries periodically
func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(rl.cleanupInt)
	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()
		for key, b := range rl.tokens {
			if now.Sub(b.lastCheck) > rl.window*2 {
				delete(rl.tokens, key)
			}
		}
		rl.mu.Unlock()
	}
}

// Allow checks if a request from the given key should be allowed
func (rl *RateLimiter) Allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	b, exists := rl.tokens[key]

	if !exists {
		rl.tokens[key] = &bucket{
			tokens:    rl.rate - 1,
			lastCheck: now,
		}
		return true
	}

	// Refill tokens based on elapsed time
	elapsed := now.Sub(b.lastCheck)
	refill := int(float64(elapsed) / float64(rl.window) * float64(rl.rate))
	b.tokens = min(rl.rate, b.tokens+refill)
	b.lastCheck = now

	if b.tokens > 0 {
		b.tokens--
		return true
	}

	return false
}

// RateLimitMiddleware creates a Gin middleware for rate limiting
func RateLimitMiddleware(rl *RateLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Use IP address as the key, or user ID if authenticated
		key := c.ClientIP()
		if userID := GetUserID(c); userID != "" {
			key = "user:" + userID
		}

		if !rl.Allow(key) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "RATE_LIMITED",
					"message": "Too many requests. Please try again later.",
				},
			})
			return
		}

		c.Next()
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
