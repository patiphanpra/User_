package migrations

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

// AutoMigrate runs GORM auto-migrations as an alternative to golang-migrate
func AutoMigrate(db *gorm.DB) error {
	log.Println("Running auto-migrations...")

	// Create tables using GORM (alternative to golang-migrate)
	// This is useful for development, but golang-migrate is recommended for production
	
	// TODO: Add model auto-migrations here
	// if err := db.AutoMigrate(
	//     &models.User{},
	//     &models.Member{},
	//     &models.ReceiptType{},
	//     &models.Receipt{},
	//     &models.File{},
	//     &models.DeathRecord{},
	//     &models.OTPToken{},
	//     &models.AuditLog{},
	//     &models.RefreshToken{},
	// ); err != nil {
	//     return fmt.Errorf("failed to run auto-migrations: %w", err)
	// }

	log.Println("Auto-migrations completed successfully")
	return nil
}

// SeedDatabase seeds initial data
func SeedDatabase(db *gorm.DB) error {
	log.Println("Seeding database...")

	// Receipt types are seeded via migration 011_seed_receipt_types.up.sql
	// Default admin is seeded via migration 012_seed_default_admin.up.sql

	log.Println("Database seeding completed")
	return nil
}

// GetMigrationStatus returns current migration status
func GetMigrationStatus(db *gorm.DB) (string, error) {
	var version int
	err := db.Raw("SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1").Scan(&version).Error
	if err != nil {
		return "", fmt.Errorf("failed to get migration version: %w", err)
	}
	return fmt.Sprintf("Current migration version: %d", version), nil
}
