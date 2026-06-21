package handlers

import (
	"encoding/csv"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/member-mgmt-system/backend/internal/models"
	"github.com/member-mgmt-system/backend/internal/repository"
	"github.com/member-mgmt-system/backend/internal/service"
)

type CreateMemberRequest struct {
	NationalID  string `json:"national_id"`
	Title       string `json:"title"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	DateOfBirth string `json:"date_of_birth"`
	Phone       string `json:"phone"`
	Email       string `json:"email"`
	Address     string `json:"address"`
	District    string `json:"district"`
	Province    string `json:"province"`
	PostalCode  string `json:"postal_code"`
	MemberType  string `json:"member_type"`
	Occupation  string `json:"occupation"`
	Status      string `json:"status"`
}

type MemberHandler struct {
	memberService *service.MemberService
	memberRepo    *repository.MemberRepository
}

func NewMemberHandler(memberService *service.MemberService, memberRepo *repository.MemberRepository) *MemberHandler {
	return &MemberHandler{
		memberService: memberService,
		memberRepo:    memberRepo,
	}
}

// CreateMember creates a new member
func (h *MemberHandler) CreateMember(c *gin.Context) {
	var req CreateMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	member := models.Member{
		IDCard:         req.NationalID,
		Title:          req.Title,
		FirstName:      req.FirstName,
		LastName:       req.LastName,
		Phone:          req.Phone,
		Email:          req.Email,
		Address:        req.Address,
		District:       req.District,
		Province:       req.Province,
		PostalCode:     req.PostalCode,
		MemberType:     req.MemberType,
		Status:         req.Status,
		MembershipDate: time.Now(),
	}

	if member.MemberType == "" {
		member.MemberType = "regular"
	}
	if member.Status == "" {
		member.Status = "active"
	}
	member.VerificationStatus = "pending"

	// Parse date of birth (frontend sends "YYYY-MM-DD")
	if req.DateOfBirth != "" {
		if dob, err := time.Parse("2006-01-02", req.DateOfBirth); err == nil {
			member.DateOfBirth = dob
		}
	}

	if err := h.memberService.CreateMember(&member); err != nil {
		if strings.Contains(err.Error(), "members_id_card_key") {
			c.JSON(http.StatusConflict, gin.H{"error": "เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว"})
			return
		}
		if strings.Contains(err.Error(), "members_email") {
			c.JSON(http.StatusConflict, gin.H{"error": "อีเมลนี้มีอยู่ในระบบแล้ว"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, member)
}

// GetMember retrieves a member by ID
func (h *MemberHandler) GetMember(c *gin.Context) {
	id := c.Param("id")
	member, err := h.memberService.GetMemberByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "member not found"})
		return
	}

	c.JSON(http.StatusOK, member)
}

// GetMembers retrieves all members with pagination
func (h *MemberHandler) GetMembers(c *gin.Context) {
	limit := 20
	page := 1

	if pageParam := c.Query("page"); pageParam != "" {
		p, err := strconv.Atoi(pageParam)
		if err == nil && p > 0 {
			page = p
		}
	}

	if limitParam := c.Query("limit"); limitParam != "" {
		l, err := strconv.Atoi(limitParam)
		if err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	offset := (page - 1) * limit

	filter := repository.MemberFilter{
		Status:     c.Query("status"),
		MemberType: c.Query("member_type"),
		Search:     c.Query("search"),
	}

	members, total, err := h.memberService.GetAllMembersFiltered(limit, offset, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        members,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": (total + int64(limit) - 1) / int64(limit),
	})
}

// UpdateMember updates a member
func (h *MemberHandler) UpdateMember(c *gin.Context) {
	id := c.Param("id")
	var updates models.Member

	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if updates.Status == "deceased" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ไม่สามารถตั้งสถานะเสียชีวิตจากหน้านี้ได้ กรุณาใช้ฟอร์มบันทึกการเสียชีวิตเพื่อแนบหลักฐาน",
		})
		return
	}

	member, err := h.memberService.GetMemberByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "member not found"})
		return
	}

	if member.Status == "deceased" && updates.Status != "" && updates.Status != "deceased" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "สมาชิกนี้มีบันทึกการเสียชีวิตแล้ว ไม่สามารถเปลี่ยนสถานะจากหน้านี้ได้",
		})
		return
	}

	// Apply updates
	if updates.Title != "" {
		member.Title = updates.Title
	}
	if updates.FirstName != "" {
		member.FirstName = updates.FirstName
	}
	if updates.LastName != "" {
		member.LastName = updates.LastName
	}
	if updates.Email != "" {
		member.Email = updates.Email
	}
	if updates.Phone != "" {
		member.Phone = updates.Phone
	}
	if updates.Address != "" {
		member.Address = updates.Address
	}
	if updates.District != "" {
		member.District = updates.District
	}
	if updates.Province != "" {
		member.Province = updates.Province
	}
	if updates.PostalCode != "" {
		member.PostalCode = updates.PostalCode
	}
	if updates.MemberType != "" {
		member.MemberType = updates.MemberType
	}
	if updates.Status != "" {
		member.Status = updates.Status
	}

	if err := h.memberService.UpdateMember(member); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, member)
}

// ExportCSV exports members as CSV, respecting the same status/member_type/
// search filters as the list view (GetMembers) — so what's exported always
// matches what's currently shown on screen.
func (h *MemberHandler) ExportCSV(c *gin.Context) {
	filter := repository.MemberFilter{
		Status:     c.Query("status"),
		MemberType: c.Query("member_type"),
		Search:     c.Query("search"),
	}

	members, err := h.memberRepo.GetAllForExport(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", "attachment; filename=members.csv")
	c.Header("Transfer-Encoding", "chunked")

	w := csv.NewWriter(c.Writer)
	// BOM for Excel Thai encoding
	c.Writer.Write([]byte("\xef\xbb\xbf"))

	w.Write([]string{
		"รหัสสมาชิก", "คำนำหน้า", "ชื่อ", "นามสกุล", "เลขบัตรประชาชน",
		"เบอร์โทร", "อีเมล", "ที่อยู่", "อำเภอ", "จังหวัด", "รหัสไปรษณีย์",
		"ประเภทสมาชิก", "สถานะ", "วันที่สมัคร",
	})

	memberTypeLabel := func(mt string) string {
		if mt == "associate" {
			return "สมาชิกสมทบ"
		}
		return "สมาชิกทั่วไป"
	}

	for _, m := range members {
		w.Write([]string{
			m.MembershipNo, m.Title, m.FirstName, m.LastName, m.IDCard,
			m.Phone, m.Email, m.Address, m.District, m.Province, m.PostalCode,
			memberTypeLabel(m.MemberType), m.Status, m.CreatedAt.Format("02/01/2006"),
		})
	}
	w.Flush()
}

// DeleteMember deletes a member
func (h *MemberHandler) DeleteMember(c *gin.Context) {
	id := c.Param("id")

	if _, err := h.memberService.GetMemberByID(id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "member not found"})
		return
	}

	if err := h.memberService.DeleteMember(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}
