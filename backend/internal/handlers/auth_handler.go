package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/member-mgmt-system/backend/internal/models"
	"github.com/member-mgmt-system/backend/internal/repository"
	"github.com/member-mgmt-system/backend/internal/service"
	"github.com/member-mgmt-system/backend/pkg/auth"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthHandler struct {
	userRepo   *repository.UserRepository
	jwtManager *auth.JWTManager
	db         *gorm.DB
	otpService *service.OTPService
}

func NewAuthHandler(userRepo *repository.UserRepository, jwtManager *auth.JWTManager, db *gorm.DB, otpService *service.OTPService) *AuthHandler {
	return &AuthHandler{
		userRepo:   userRepo,
		jwtManager: jwtManager,
		db:         db,
		otpService: otpService,
	}
}

type MemberLoginRequest struct {
	NationalID string `json:"national_id" binding:"required"`
	Phone      string `json:"phone" binding:"required"`
}

func (h *AuthHandler) MemberLogin(c *gin.Context) {
	var req MemberLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var member models.Member
	if err := h.db.Where("id_card = ?", req.NationalID).First(&member).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "ไม่พบสมาชิกที่มีเลขบัตรประชาชนนี้"})
		return
	}

	if member.Phone != req.Phone {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "เบอร์โทรศัพท์ไม่ถูกต้อง"})
		return
	}

	if member.Status != "active" {
		c.JSON(http.StatusForbidden, gin.H{"error": "บัญชีสมาชิกถูกระงับ"})
		return
	}

	accessToken, err := h.jwtManager.GenerateAccessToken(member.ID, member.Phone, "member")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้าง token ได้"})
		return
	}

	refreshToken, err := h.jwtManager.GenerateRefreshToken(member.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้าง refresh token ได้"})
		return
	}

	c.SetCookie("refresh_token", refreshToken, 7*24*3600, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{
		"access_token": accessToken,
		"user": gin.H{
			"id":         member.ID,
			"email":      member.Phone,
			"first_name": member.FirstName,
			"last_name":  member.LastName,
			"role":       "member",
			"status":     member.Status,
		},
	})
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userRepo.GetByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if user.Status != "active" {
		c.JSON(http.StatusForbidden, gin.H{"error": "account is not active"})
		return
	}

	accessToken, err := h.jwtManager.GenerateAccessToken(user.ID, user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	refreshToken, err := h.jwtManager.GenerateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate refresh token"})
		return
	}

	c.SetCookie("refresh_token", refreshToken, 7*24*3600, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"access_token": accessToken,
		"user":         user,
	})
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing refresh token"})
		return
	}

	claims, err := h.jwtManager.ValidateRefreshToken(refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid refresh token"})
		return
	}

	user, err := h.userRepo.GetByID(claims.Subject)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	accessToken, err := h.jwtManager.GenerateAccessToken(user.ID, user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token": accessToken,
	})
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get("user_id")
	id := userID.(string)

	// Try users table first
	user, err := h.userRepo.GetByID(id)
	if err == nil {
		c.JSON(http.StatusOK, gin.H{
			"user": gin.H{
				"id":             user.ID,
				"email":          user.Email,
				"phone":          user.Phone,
				"first_name":     user.FirstName,
				"last_name":      user.LastName,
				"role":           user.Role,
				"status":         user.Status,
				"created_at":     user.CreatedAt,
				"updated_at":     user.UpdatedAt,
			},
		})
		return
	}

	// Fall back to members table (member login)
	var member models.Member
	if err := h.db.First(&member, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": gin.H{
		"id":         member.ID,
		"email":      member.Phone,
		"first_name": member.FirstName,
		"last_name":  member.LastName,
		"role":       "member",
		"status":     member.Status,
	}})
}

type ForgotPasswordRequest struct {
	Phone string `json:"phone" binding:"required"`
}

// ForgotPassword starts a password-reset session for a staff/admin user.
// Members log in with national ID + phone and have no password, so this
// only applies to the users table.
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := h.db.Where("phone = ?", req.Phone).First(&user).Error; err != nil {
		// Deliberately the same response whether or not the phone exists,
		// so this endpoint can't be used to enumerate registered phone
		// numbers.
		c.JSON(http.StatusOK, gin.H{"session_id": ""})
		return
	}

	otp, err := h.otpService.GenerateOTP(user.ID, user.Phone)
	if err != nil {
		// otp is still non-nil here (the record was created even though
		// delivery failed) — surface the delivery error so the user isn't
		// left waiting for a code that will never arrive, e.g. because
		// they haven't linked LINE yet.
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"session_id": otp.ID})
}

type VerifyOTPRequest struct {
	SessionID string `json:"session_id" binding:"required"`
	OTP       string `json:"otp" binding:"required"`
}

func (h *AuthHandler) VerifyOTPHandler(c *gin.Context) {
	var req VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	otp, err := h.otpService.VerifyOTP(req.SessionID, req.OTP)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"session_id": otp.ID})
}

type ResetPasswordRequest struct {
	SessionID string `json:"session_id" binding:"required"`
	Password  string `json:"password" binding:"required,min=8"`
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	otp, err := h.otpService.ConsumeVerifiedSession(req.SessionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถตั้งรหัสผ่านได้"})
		return
	}

	if err := h.db.Model(&models.User{}).
		Where("id = ?", otp.UserID).
		Update("password", string(hash)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกรหัสผ่านไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ตั้งรหัสผ่านใหม่สำเร็จ"})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	c.SetCookie("refresh_token", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}
