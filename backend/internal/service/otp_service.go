package service

import (
	"fmt"
	"time"

	"github.com/member-mgmt-system/backend/internal/models"
	"github.com/member-mgmt-system/backend/internal/repository"
	"github.com/member-mgmt-system/backend/pkg/sms"
)

type OTPService struct {
	otpRepo   *repository.OTPRepository
	smsClient *sms.Client
}

func NewOTPService(otpRepo *repository.OTPRepository, smsClient *sms.Client) *OTPService {
	return &OTPService{
		otpRepo:   otpRepo,
		smsClient: smsClient,
	}
}

// GenerateOTP starts a forgot-password attempt for the given user.
// ThaiBulkSMS generates the actual PIN, sends it via SMS, and tracks its
// own expiry — we only store the opaque token they return. The local
// record's ID is returned as the session_id the caller should carry
// through verify/reset.
//
// Unlike a LINE-based flow, this needs no prior account-linking step —
// the phone number is already on file for every staff/admin user, so
// delivery can happen immediately.
func (s *OTPService) GenerateOTP(userID, phone string) (*models.OTP, error) {
	if !s.smsClient.Enabled() {
		return nil, fmt.Errorf("ระบบส่ง SMS ยังไม่ได้ตั้งค่า (THAIBULKSMS_API_KEY/SECRET)")
	}

	token, err := s.smsClient.RequestOTP(phone)
	if err != nil {
		return nil, fmt.Errorf("ส่งรหัส OTP ผ่าน SMS ไม่สำเร็จ: %w", err)
	}

	otp := &models.OTP{
		UserID:        userID,
		Phone:         phone,
		ProviderToken: token,
		Verified:      false,
		Used:          false,
	}
	if err := s.otpRepo.Create(otp); err != nil {
		return nil, err
	}

	return otp, nil
}

// VerifyOTP checks the entered PIN against the session (OTP record ID) by
// delegating to ThaiBulkSMS — they own the PIN's correctness and expiry,
// so there's no local code or expiry comparison here. On success it marks
// the record verified — but NOT used — so the caller can proceed to set a
// new password. It deliberately does not mark Used here: that happens only
// once the password has actually been changed, so a verified-but-not-yet-
// reset session can still complete the flow if the user navigates away and
// back, but a session that already completed a reset can't be replayed.
func (s *OTPService) VerifyOTP(sessionID, pin string) (*models.OTP, error) {
	otp, err := s.otpRepo.GetByID(sessionID)
	if err != nil {
		return nil, fmt.Errorf("ไม่พบเซสชันนี้")
	}
	if otp.Used {
		return nil, fmt.Errorf("รหัส OTP นี้ถูกใช้ไปแล้ว")
	}

	if err := s.smsClient.VerifyOTP(otp.ProviderToken, pin); err != nil {
		return nil, err
	}

	otp.Verified = true
	now := time.Now()
	otp.VerifiedAt = &now
	if err := s.otpRepo.Update(otp); err != nil {
		return nil, err
	}

	return otp, nil
}

// ConsumeVerifiedSession checks that a session has been verified (and not
// already used), then marks it used. Called once the password has
// actually been reset. Expiry is no longer checked here — by this point
// ThaiBulkSMS has already confirmed the PIN was entered correctly within
// their own expiry window, so re-checking a local expiry would be
// redundant and could only ever reject otherwise-valid sessions.
func (s *OTPService) ConsumeVerifiedSession(sessionID string) (*models.OTP, error) {
	otp, err := s.otpRepo.GetByID(sessionID)
	if err != nil {
		return nil, fmt.Errorf("ไม่พบเซสชันนี้")
	}
	if !otp.Verified {
		return nil, fmt.Errorf("กรุณายืนยันรหัส OTP ก่อนตั้งรหัสผ่านใหม่")
	}
	if otp.Used {
		return nil, fmt.Errorf("เซสชันนี้ถูกใช้ไปแล้ว")
	}

	otp.Used = true
	now := time.Now()
	otp.UsedAt = &now
	if err := s.otpRepo.Update(otp); err != nil {
		return nil, err
	}

	return otp, nil
}

// CleanupExpiredOTPs removes old OTP session records (housekeeping only —
// ThaiBulkSMS independently enforces its own token expiry, so this is
// just to keep our local table from growing unbounded).
func (s *OTPService) CleanupExpiredOTPs() error {
	return s.otpRepo.DeleteExpired()
}