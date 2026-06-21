package middleware

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// CORS middleware
func CORSMiddleware(c *gin.Context) {
	cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:8080"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	})(c)
}

// Error handling middleware
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		// TODO: Handle errors here
	}
}

// Request logging middleware
func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		// TODO: Log requests
		c.Next()
	}
}
