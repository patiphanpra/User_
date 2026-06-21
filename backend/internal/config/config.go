package config

import (
	"os"
	"time"
)

type Config struct {
	// Server
	Environment string
	ServerPort  string

	// Database
	DatabaseURL string
	DBHost      string
	DBPort      string
	DBName      string
	DBUser      string
	DBPassword  string

	// JWT
	JWTSecret           string
	AccessTokenTTL      time.Duration
	RefreshTokenTTL     time.Duration

	// S3/R2
	R2Endpoint   string
	R2AccessKey  string
	R2SecretKey  string
	R2BucketName string
	R2Region     string

	// Line OTP / notifications (Messaging API)
	LineChannelID          string
	LineChannelSecret      string
	LineChannelAccessToken string
	LineRedirectURI        string

	// ThaiBulkSMS (used for forgot-password OTP — SMS needs no
	// account-linking step, unlike LINE)
	ThaiBulkSMSAPIKey    string
	ThaiBulkSMSAPISecret string
	ThaiBulkSMSSender    string

	// Frontend
	FrontendURL string
	CorsOrigins string
}

func LoadConfig() *Config {
	return &Config{
		Environment:     getEnv("ENVIRONMENT", "development"),
		ServerPort:      getEnv("SERVER_PORT", "8080"),
		DatabaseURL:     getEnv("DATABASE_URL", ""),
		DBHost:          getEnv("DB_HOST", "localhost"),
		DBPort:          getEnv("DB_PORT", "5432"),
		DBName:          getEnv("DB_NAME", "member_mgmt"),
		DBUser:          getEnv("DB_USER", "postgres"),
		DBPassword:      getEnv("DB_PASSWORD", ""),
		JWTSecret:       getEnv("JWT_SECRET", "your-secret-key"),
		AccessTokenTTL:  15 * time.Minute,
		RefreshTokenTTL: 7 * 24 * time.Hour,
		R2Endpoint:      getEnv("R2_ENDPOINT", ""),
		R2AccessKey:     getEnv("R2_ACCESS_KEY", ""),
		R2SecretKey:     getEnv("R2_SECRET_KEY", ""),
		R2BucketName:    getEnv("R2_BUCKET_NAME", "member-docs"),
		R2Region:        getEnv("R2_REGION", "auto"),
		LineChannelID:   getEnv("LINE_CHANNEL_ID", ""),
		LineChannelSecret: getEnv("LINE_CHANNEL_SECRET", ""),
		LineChannelAccessToken: getEnv("LINE_CHANNEL_ACCESS_TOKEN", ""),
		LineRedirectURI: getEnv("LINE_REDIRECT_URI", "http://localhost:8080/api/auth/line/callback"),
		ThaiBulkSMSAPIKey:    getEnv("THAIBULKSMS_API_KEY", ""),
		ThaiBulkSMSAPISecret: getEnv("THAIBULKSMS_API_SECRET", ""),
		ThaiBulkSMSSender:    getEnv("THAIBULKSMS_SENDER", ""),
		FrontendURL:     getEnv("FRONTEND_URL", "http://localhost:3000"),
		CorsOrigins:     getEnv("CORS_ORIGINS", "http://localhost:3000"),
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
