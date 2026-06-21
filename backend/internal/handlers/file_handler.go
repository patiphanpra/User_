package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/member-mgmt-system/backend/internal/models"
	"gorm.io/gorm"
)

type FileHandler struct {
	db         *gorm.DB
	uploadDir  string
	publicBase string
}

func NewFileHandler(db *gorm.DB) *FileHandler {
	uploadDir := "/app/uploads"
	os.MkdirAll(uploadDir, 0755)
	return &FileHandler{db: db, uploadDir: uploadDir, publicBase: "/uploads"}
}

// UploadFile handles file upload for a member
func (h *FileHandler) UploadFile(c *gin.Context) {
	memberID := c.Param("id")

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบไฟล์ที่อัพโหลด"})
		return
	}
	defer file.Close()

	// Validate file size (10MB max)
	if header.Size > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไฟล์ต้องมีขนาดไม่เกิน 10MB"})
		return
	}

	// Validate mime type
	mimeType := header.Header.Get("Content-Type")
	allowed := map[string]bool{
		"image/jpeg":      true,
		"image/png":       true,
		"application/pdf": true,
	}
	if !allowed[mimeType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รองรับเฉพาะไฟล์ JPG, PNG, PDF"})
		return
	}

	fileType := c.PostForm("file_type")
	if fileType == "" {
		fileType = "receipt"
	}
	description := c.PostForm("description")

	// Save file
	ext := filepath.Ext(header.Filename)
	newName := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	dir := filepath.Join(h.uploadDir, memberID)
	os.MkdirAll(dir, 0755)
	savePath := filepath.Join(dir, newName)

	buf := make([]byte, header.Size)
	file.Read(buf)
	if err := os.WriteFile(savePath, buf, 0644); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกไฟล์ไม่สำเร็จ"})
		return
	}

	fileURL := fmt.Sprintf("%s/%s/%s", h.publicBase, memberID, newName)

	userID, _ := c.Get("user_id")
	uploadedBy := ""
	if userID != nil {
		uploadedBy = userID.(string)
	}

	record := models.MemberFile{
		MemberID:           memberID,
		FileName:           header.Filename,
		FileType:           fileType,
		FileURL:            fileURL,
		FileSize:           header.Size,
		MimeType:           mimeType,
		VerificationStatus: "pending",
		UploadedBy:         uploadedBy,
		Description:        description,
	}

	// Map file_type to DB enum
	validTypes := map[string]bool{"id_card": true, "thainoi": true, "license": true, "certificate": true, "document": true, "receipt": true, "other": true}
	if !validTypes[record.FileType] {
		record.FileType = "other"
	}

	if err := h.db.Table("files").Create(&record).Error; err != nil {
		if strings.Contains(err.Error(), "invalid input value for enum") {
			record.FileType = "other"
			h.db.Table("files").Create(&record)
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusCreated, gin.H{"file": record})
}

// ListFiles returns files for a member
func (h *FileHandler) ListFiles(c *gin.Context) {
	memberID := c.Param("id")
	var files []models.MemberFile
	h.db.Table("files").Where("member_id = ? AND deleted_at IS NULL", memberID).Order("created_at DESC").Find(&files)
	c.JSON(http.StatusOK, gin.H{"files": files})
}

// UpdateFileStatus updates verification status of a file
func (h *FileHandler) UpdateFileStatus(c *gin.Context) {
	id := c.Param("id")
	var body struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	allowed := map[string]bool{"pending": true, "verified": true, "rejected": true, "needsrevision": true}
	if !allowed[body.Status] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status"})
		return
	}
	if err := h.db.Table("files").Where("id = ?", id).Update("verification_status", body.Status).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

type FileWithMember struct {
	models.MemberFile
	MemberFirstName string `json:"member_first_name"`
	MemberLastName  string `json:"member_last_name"`
	MembershipNo    string `json:"membership_no"`
}

// ListAllFiles returns all uploaded files with member info (for staff)
func (h *FileHandler) ListAllFiles(c *gin.Context) {
	var results []FileWithMember
	h.db.Table("files").
		Select("files.*, members.first_name as member_first_name, members.last_name as member_last_name, members.membership_no").
		Joins("LEFT JOIN members ON members.id = files.member_id").
		Where("files.deleted_at IS NULL").
		Order("files.created_at DESC").
		Limit(100).
		Scan(&results)
	c.JSON(http.StatusOK, gin.H{"files": results})
}
