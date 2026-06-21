package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/member-mgmt-system/backend/internal/models"
	"gorm.io/gorm"
)

type DeathHandler struct {
	db         *gorm.DB
	uploadDir  string
	publicBase string
}

func NewDeathHandler(db *gorm.DB) *DeathHandler {
	uploadDir := "/app/uploads"
	os.MkdirAll(uploadDir, 0755)
	return &DeathHandler{db: db, uploadDir: uploadDir, publicBase: "/uploads"}
}

const maxCertificateSize = 10 * 1024 * 1024 // 10MB

var allowedCertificateMimeTypes = map[string]bool{
	"image/jpeg":      true,
	"image/png":       true,
	"application/pdf": true,
}

// parseDeathDate validates and parses the death_date form value. It's a
// pure function (no gin.Context / DB) so the date rules — required,
// correct format, not in the future — can be unit tested directly.
// now is passed in explicitly rather than read from time.Now() so tests
// are deterministic instead of depending on the day they happen to run.
func parseDeathDate(deathDateStr string, now time.Time) (time.Time, string) {
	if deathDateStr == "" {
		return time.Time{}, "กรุณาระบุวันที่เสียชีวิต"
	}
	deathDate, err := time.Parse("2006-01-02", deathDateStr)
	if err != nil {
		return time.Time{}, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)"
	}
	if deathDate.After(now) {
		return time.Time{}, "วันที่เสียชีวิตต้องไม่เป็นวันที่ในอนาคต"
	}
	return deathDate, ""
}

// validateCertificateFile checks the death certificate upload's size and
// MIME type. Pure function, no I/O — the actual file read/write stays in
// RecordDeath.
func validateCertificateFile(size int64, mimeType string) string {
	if size > maxCertificateSize {
		return "ไฟล์ต้องมีขนาดไม่เกิน 10MB"
	}
	if !allowedCertificateMimeTypes[mimeType] {
		return "รองรับเฉพาะไฟล์ JPG, PNG, PDF"
	}
	return ""
}

// RecordDeath creates a death record for a member, uploads the death
// certificate (optional), and marks the member's status as "deceased".
// This is the only way a member's status should become "deceased" —
// UpdateMember intentionally rejects that value to keep a record on file.
func (h *DeathHandler) RecordDeath(c *gin.Context) {
	memberID := c.Param("id")

	var member models.Member
	if err := h.db.First(&member, "id = ?", memberID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบสมาชิก"})
		return
	}

	deathDateStr := c.PostForm("death_date")
	deathDate, errMsg := parseDeathDate(deathDateStr, time.Now())
	if errMsg != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": errMsg})
		return
	}

	deathLocation := c.PostForm("death_location")
	notes := c.PostForm("notes")

	userID, _ := c.Get("user_id")
	recordedBy := ""
	if userID != nil {
		recordedBy = userID.(string)
	}

	// Certificate upload is optional at submit time but strongly recommended;
	// the frontend should warn the user if they skip it.
	certURL := ""
	file, header, ferr := c.Request.FormFile("certificate")
	if ferr == nil {
		defer file.Close()

		if errMsg := validateCertificateFile(header.Size, header.Header.Get("Content-Type")); errMsg != "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": errMsg})
			return
		}

		ext := filepath.Ext(header.Filename)
		newName := fmt.Sprintf("death-cert-%s%s", uuid.New().String(), ext)
		dir := filepath.Join(h.uploadDir, memberID)
		os.MkdirAll(dir, 0755)
		savePath := filepath.Join(dir, newName)

		buf := make([]byte, header.Size)
		file.Read(buf)
		if err := os.WriteFile(savePath, buf, 0644); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกไฟล์ไม่สำเร็จ"})
			return
		}
		certURL = fmt.Sprintf("%s/%s/%s", h.publicBase, memberID, newName)
	}

	record := models.DeathRecord{
		MemberID:            memberID,
		DeathDate:           deathDate,
		DeathCertificateURL: certURL,
		DeathLocation:       deathLocation,
		RecordedBy:          recordedBy,
		Notes:               notes,
	}

	// Wrap the death_records insert and the member status update in a single
	// transaction so the dashboard count and the underlying record can never
	// drift out of sync with each other.
	txErr := h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Table("death_records").
			Where("member_id = ?", memberID).
			Assign(record).
			FirstOrCreate(&record, "member_id = ?", memberID).Error; err != nil {
			return err
		}
		if err := tx.Model(&models.Member{}).
			Where("id = ?", memberID).
			Update("status", "deceased").Error; err != nil {
			return err
		}
		return nil
	})
	if txErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": txErr.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"death_record": record})
}

// GetDeathRecord returns the death record for a member, if one exists.
func (h *DeathHandler) GetDeathRecord(c *gin.Context) {
	memberID := c.Param("id")
	var record models.DeathRecord
	if err := h.db.Table("death_records").Where("member_id = ?", memberID).First(&record).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบันทึกการเสียชีวิต"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"death_record": record})
}
