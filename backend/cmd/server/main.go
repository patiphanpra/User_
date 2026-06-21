package main

import (
	"fmt"
	"log"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/member-mgmt-system/backend/internal/config"
	"github.com/member-mgmt-system/backend/internal/handlers"
	"github.com/member-mgmt-system/backend/internal/middleware"
	"github.com/member-mgmt-system/backend/internal/repository"
	"github.com/member-mgmt-system/backend/internal/service"
	"github.com/member-mgmt-system/backend/pkg/auth"
	"github.com/member-mgmt-system/backend/pkg/database"
	"github.com/member-mgmt-system/backend/pkg/sms"
)

func init() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}
}

func main() {
	cfg := config.LoadConfig()

	db, err := database.InitDB(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Init JWT
	jwtManager := auth.NewJWTManager(cfg.JWTSecret, cfg.AccessTokenTTL, cfg.RefreshTokenTTL)

	// Init repositories
	userRepo := repository.NewUserRepository(db)
	memberRepo := repository.NewMemberRepository(db)
	otpRepo := repository.NewOTPRepository(db)

	// Init external clients
	smsClient := sms.NewClient(cfg.ThaiBulkSMSAPIKey, cfg.ThaiBulkSMSAPISecret, cfg.ThaiBulkSMSSender)

	// Init services
	memberService := service.NewMemberService(memberRepo)
	otpService := service.NewOTPService(otpRepo, smsClient)

	// Init handlers
	authHandler := handlers.NewAuthHandler(userRepo, jwtManager, db, otpService)
	memberHandler := handlers.NewMemberHandler(memberService, memberRepo)
	receiptHandler := handlers.NewReceiptHandler(db, smsClient)
	fileHandler := handlers.NewFileHandler(db)
	statsHandler := handlers.NewStatsHandler(db)
	deathHandler := handlers.NewDeathHandler(db)

	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// CORS — origins come from CORS_ORIGINS (comma-separated), not hardcoded,
	// so production deployments (Vercel, etc.) actually work. Falls back to
	// localhost:3000 for local dev if the env var isn't set.
	corsOrigins := strings.Split(cfg.CorsOrigins, ",")
	for i := range corsOrigins {
		corsOrigins[i] = strings.TrimSpace(corsOrigins[i])
	}
	log.Printf("CORS_ORIGINS raw env value: %q", cfg.CorsOrigins)
	log.Printf("CORS allowed origins (parsed): %q", corsOrigins)
	router.Use(func(c *gin.Context) {
		if o := c.Request.Header.Get("Origin"); o != "" {
			log.Printf("Incoming request Origin header: %q", o)
		}
		c.Next()
	})
	router.Use(cors.New(cors.Config{
		AllowOrigins:     corsOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	router.Use(middleware.ErrorHandler())

	// TEMPORARY DEBUG ENDPOINT — remove after diagnosing CORS issue.
	// Shows exactly what CORS_ORIGINS the running process actually loaded,
	// to rule out stale env vars / Railway variable propagation issues
	// rather than continuing to guess at the cause.
	router.GET("/debug/cors", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"raw_cors_origins_env": cfg.CorsOrigins,
			"parsed_origins":       corsOrigins,
			"frontend_url":         cfg.FrontendURL,
		})
	})

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API routes
	api := router.Group("/api")
	{
		// Auth routes (public)
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/login", authHandler.Login)
			authGroup.POST("/member-login", authHandler.MemberLogin)
			authGroup.POST("/refresh", authHandler.Refresh)
			authGroup.POST("/logout", authHandler.Logout)
			authGroup.POST("/forgot-password", authHandler.ForgotPassword)
			authGroup.POST("/verify-otp", authHandler.VerifyOTPHandler)
			authGroup.POST("/reset-password", authHandler.ResetPassword)
			authGroup.GET("/me", middleware.AuthMiddleware(jwtManager), authHandler.Me)
		}

		// Member routes (protected)
		members := api.Group("/members")
		members.Use(middleware.AuthMiddleware(jwtManager))
		{
			members.GET("", memberHandler.GetMembers)
			members.POST("", memberHandler.CreateMember)
			members.GET("/export/csv", memberHandler.ExportCSV)
			members.GET("/:id", memberHandler.GetMember)
			members.PUT("/:id", memberHandler.UpdateMember)
			members.DELETE("/:id", memberHandler.DeleteMember)
		}

		// Receipt routes (protected)
		api.GET("/receipt-types", middleware.AuthMiddleware(jwtManager), receiptHandler.GetReceiptTypes)
		receipts := api.Group("/receipts")
		receipts.Use(middleware.AuthMiddleware(jwtManager))
		{
			receipts.GET("", receiptHandler.ListReceipts)
			receipts.POST("", receiptHandler.CreateReceipt)
			receipts.GET("/:id/download", receiptHandler.DownloadReceipt)
		}

		// Member receipts and files (protected)
		members.GET("/:id/receipts", receiptHandler.GetMemberReceipts)
		members.GET("/:id/files", fileHandler.ListFiles)
		members.POST("/:id/files", fileHandler.UploadFile)

		// Member death record (protected) — the only path that may set
		// a member's status to "deceased"
		members.POST("/:id/death-record", deathHandler.RecordDeath)
		members.GET("/:id/death-record", deathHandler.GetDeathRecord)

		// Stats (protected)
		api.GET("/stats/dashboard", middleware.AuthMiddleware(jwtManager), statsHandler.GetDashboard)

		// All files (protected)
		api.GET("/files", middleware.AuthMiddleware(jwtManager), fileHandler.ListAllFiles)
		api.PATCH("/files/:id/status", middleware.AuthMiddleware(jwtManager), fileHandler.UpdateFileStatus)

		// Serve uploaded files
		router.Static("/uploads", "/app/uploads")
	}

	port := cfg.ServerPort
	if port == "" {
		port = "8080"
	}
	addr := fmt.Sprintf(":%s", port)
	log.Printf("Server running on %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
