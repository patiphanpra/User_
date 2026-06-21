package repository

import (
	"fmt"
	"time"

	"github.com/member-mgmt-system/backend/internal/models"
	"gorm.io/gorm"
)

type OTPRepository struct {
	db *gorm.DB
}

func NewOTPRepository(db *gorm.DB) *OTPRepository {
	return &OTPRepository{db: db}
}

func (r *OTPRepository) Create(otp *models.OTP) error {
	return r.db.Create(otp).Error
}

func (r *OTPRepository) GetByID(id string) (*models.OTP, error) {
	var otp models.OTP
	if err := r.db.First(&otp, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &otp, nil
}

func (r *OTPRepository) GetLatestByPhone(phone string) (*models.OTP, error) {
	var otp models.OTP
	if err := r.db.Where("phone = ?", phone).
		Order("created_at DESC").
		First(&otp).Error; err != nil {
		return nil, err
	}
	return &otp, nil
}

func (r *OTPRepository) Update(otp *models.OTP) error {
	return r.db.Save(otp).Error
}

func (r *OTPRepository) DeleteByID(id string) error {
	return r.db.Delete(&models.OTP{}, "id = ?", id).Error
}

// DeleteExpired removes old, never-verified OTP session records (pure
// housekeeping — ThaiBulkSMS enforces the actual PIN's expiry on their
// end independently of this). Anything older than 24 hours and never
// verified is safe to clear.
func (r *OTPRepository) DeleteExpired() error {
	return r.db.Where("verified = ? AND created_at < ?", false, time.Now().Add(-24*time.Hour)).
		Delete(&models.OTP{}).Error
}

func (r *OTPRepository) GetUnusedByPhone(phone string) (*models.OTP, error) {
	var otp models.OTP
	if err := r.db.Where("phone = ? AND used = ?", phone, false).
		Order("created_at DESC").
		First(&otp).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("no active OTP found")
		}
		return nil, err
	}
	return &otp, nil
}
