package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/member-mgmt-system/backend/internal/models"
	"gorm.io/gorm"
)

type StatsHandler struct {
	db *gorm.DB
}

func NewStatsHandler(db *gorm.DB) *StatsHandler {
	return &StatsHandler{db: db}
}

type DashboardStats struct {
	TotalMembers    int64            `json:"total_members"`
	ActiveMembers   int64            `json:"active_members"`
	DeceasedMembers int64            `json:"deceased_members"`
	PendingPayments int64            `json:"pending_payments"`
	RecentMembers   []models.Member  `json:"recent_members"`
	RecentReceipts  []RecentReceipt  `json:"recent_receipts"`
}

type RecentReceipt struct {
	ID              string  `json:"id"`
	ReceiptNumber   string  `json:"receipt_number"`
	MemberID        string  `json:"member_id"`
	MemberName      string  `json:"member_name"`
	Amount          float64 `json:"amount"`
	IssueDate       string  `json:"issue_date"`
	Status          string  `json:"status"`
	ReceiptTypeName string  `json:"receipt_type_name"`
}

func (h *StatsHandler) GetDashboard(c *gin.Context) {
	var stats DashboardStats

	h.db.Model(&models.Member{}).Count(&stats.TotalMembers)
	h.db.Model(&models.Member{}).Where("status = ?", "active").Count(&stats.ActiveMembers)
	h.db.Model(&models.Member{}).Where("status = ?", "deceased").Count(&stats.DeceasedMembers)
	h.db.Model(&models.Receipt{}).Where("status = ?", "pending").Count(&stats.PendingPayments)

	h.db.Model(&models.Member{}).
		Order("created_at DESC").
		Limit(5).
		Find(&stats.RecentMembers)

	type row struct {
		ID              string    `json:"id"`
		ReceiptNumber   string    `json:"receipt_number"`
		MemberID        string    `json:"member_id"`
		FirstName       string
		LastName        string
		Amount          float64   `json:"amount"`
		IssueDate       time.Time `json:"issue_date"`
		Status          string    `json:"status"`
		ReceiptTypeName string
	}
	var rows []row
	h.db.Table("receipts r").
		Select("r.id, r.receipt_number, r.member_id, m.first_name, m.last_name, r.amount, r.issue_date, r.status, rt.name AS receipt_type_name").
		Joins("LEFT JOIN members m ON m.id = r.member_id").
		Joins("LEFT JOIN receipt_types rt ON rt.id = r.receipt_type_id").
		Order("r.created_at DESC").
		Limit(5).
		Scan(&rows)

	for _, r := range rows {
		stats.RecentReceipts = append(stats.RecentReceipts, RecentReceipt{
			ID:              r.ID,
			ReceiptNumber:   r.ReceiptNumber,
			MemberID:        r.MemberID,
			MemberName:      r.FirstName + " " + r.LastName,
			Amount:          r.Amount,
			IssueDate:       r.IssueDate.Format("2006-01-02"),
			Status:          r.Status,
			ReceiptTypeName: r.ReceiptTypeName,
		})
	}
	if stats.RecentReceipts == nil {
		stats.RecentReceipts = []RecentReceipt{}
	}
	if stats.RecentMembers == nil {
		stats.RecentMembers = []models.Member{}
	}

	c.JSON(http.StatusOK, gin.H{"stats": stats})
}
