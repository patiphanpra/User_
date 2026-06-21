package handlers

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/member-mgmt-system/backend/internal/models"
	"github.com/member-mgmt-system/backend/pkg/sms"
	"gorm.io/gorm"
)

type ReceiptHandler struct {
	db        *gorm.DB
	smsClient *sms.Client
}

func NewReceiptHandler(db *gorm.DB, smsClient *sms.Client) *ReceiptHandler {
	return &ReceiptHandler{db: db, smsClient: smsClient}
}

// GetReceiptTypes returns all active receipt types
func (h *ReceiptHandler) GetReceiptTypes(c *gin.Context) {
	var types []models.ReceiptType
	if err := h.db.Where("is_active = ?", true).Order("display_order").Find(&types).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"receipt_types": types})
}

type CreateReceiptRequest struct {
	MemberID      string  `json:"member_id"`
	ReceiptTypeID string  `json:"receipt_type_id"`
	Amount        float64 `json:"amount"`
	ReceiptDate   string  `json:"receipt_date"`
	Notes         string  `json:"notes"`
}

// CreateReceipt creates a new receipt
func (h *ReceiptHandler) CreateReceipt(c *gin.Context) {
	var req CreateReceiptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	issueDate := time.Now()
	if req.ReceiptDate != "" {
		if d, err := time.Parse("2006-01-02", req.ReceiptDate); err == nil {
			issueDate = d
		}
	}

	userID, _ := c.Get("user_id")
	issuedByStr := ""
	if userID != nil {
		issuedByStr = userID.(string)
	}

	receipt := models.Receipt{
		ReceiptNumber: fmt.Sprintf("R%d", time.Now().UnixMilli()),
		MemberID:      req.MemberID,
		ReceiptTypeID: req.ReceiptTypeID,
		Amount:        req.Amount,
		IssueDate:     issueDate,
		Status:        "approved",
		Notes:         req.Notes,
	}
	if issuedByStr != "" {
		receipt.IssuedBy = &issuedByStr
	}

	if err := h.db.Create(&receipt).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	h.notifyMemberOfReceipt(receipt)

	c.JSON(http.StatusCreated, receipt)
}

// notifyMemberOfReceipt sends an SMS notification to the member a receipt
// was issued to. Runs asynchronously and fails silently (logged only) —
// notification delivery is best-effort and must never block or fail the
// receipt-creation response, since the receipt record itself is already
// committed.
func (h *ReceiptHandler) notifyMemberOfReceipt(receipt models.Receipt) {
	go func() {
		var member models.Member
		if err := h.db.First(&member, "id = ?", receipt.MemberID).Error; err != nil {
			log.Printf("receipt notification: member %s not found: %v", receipt.MemberID, err)
			return
		}
		if member.Phone == "" {
			return // no phone number on file — nothing to do
		}
		if !h.smsClient.Enabled() {
			return // SMS not configured in this environment
		}

		var receiptType models.ReceiptType
		typeName := "ใบเสร็จ"
		if err := h.db.First(&receiptType, "id = ?", receipt.ReceiptTypeID).Error; err == nil {
			typeName = receiptType.Name
		}

		text := fmt.Sprintf(
			"มีใบเสร็จใหม่สำหรับคุณ ประเภท: %s จำนวนเงิน: %.2f บาท กรุณาเข้าสู่ระบบเพื่อดูรายละเอียด",
			typeName, receipt.Amount,
		)
		if err := h.smsClient.SendText(member.Phone, text); err != nil {
			log.Printf("receipt notification: failed to send to member %s: %v", member.ID, err)
		}
	}()
}

// ListReceipts returns paginated receipts
func (h *ReceiptHandler) ListReceipts(c *gin.Context) {
	var receipts []models.Receipt
	var total int64

	h.db.Model(&models.Receipt{}).Count(&total)
	h.db.Order("created_at DESC").Limit(20).Find(&receipts)

	c.JSON(http.StatusOK, gin.H{
		"data":  receipts,
		"total": total,
	})
}

// GetMemberReceipts returns receipts for a specific member
func (h *ReceiptHandler) GetMemberReceipts(c *gin.Context) {
	memberID := c.Param("id")
	var receipts []models.Receipt
	var total int64

	h.db.Model(&models.Receipt{}).Where("member_id = ?", memberID).Count(&total)
	h.db.Where("member_id = ?", memberID).Order("created_at DESC").Limit(20).Find(&receipts)

	c.JSON(http.StatusOK, gin.H{
		"data":        receipts,
		"total":       total,
		"page":        1,
		"limit":       20,
		"total_pages": 1,
	})
}

// DownloadReceipt generates an HTML receipt for download
func (h *ReceiptHandler) DownloadReceipt(c *gin.Context) {
	id := c.Param("id")

	var receipt models.Receipt
	if err := h.db.First(&receipt, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบใบเสร็จ"})
		return
	}

	var member models.Member
	h.db.First(&member, "id = ?", receipt.MemberID)

	var receiptType models.ReceiptType
	h.db.First(&receiptType, "id = ?", receipt.ReceiptTypeID)

	html := fmt.Sprintf(`<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>ใบเสร็จ %s</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Sarabun', sans-serif; background: #f5f5f5; display: flex; justify-content: center; padding: 40px 20px; }
  .receipt { background: white; width: 600px; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 24px; }
  .header h1 { font-size: 22px; font-weight: 700; }
  .header p { font-size: 14px; color: #555; margin-top: 4px; }
  .receipt-title { text-align: center; font-size: 18px; font-weight: 600; margin-bottom: 24px; color: #1a1a1a; }
  .receipt-number { text-align: center; font-size: 13px; color: #777; margin-bottom: 24px; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; font-size: 15px; }
  .row .label { color: #555; }
  .row .value { font-weight: 600; }
  .amount-row { display: flex; justify-content: space-between; padding: 14px 0; margin-top: 8px; font-size: 18px; font-weight: 700; border-top: 2px solid #333; }
  .status-badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 13px; background: #dcfce7; color: #166534; }
  .footer { text-align: center; margin-top: 32px; font-size: 13px; color: #999; }
  @media print { body { background: white; padding: 0; } .receipt { box-shadow: none; } .no-print { display: none; } }
</style>
</head>
<body>
<div class="receipt">
  <div class="header">
    <h1>สหกรณ์ออมทรัพย์</h1>
    <p>ระบบจัดการสมาชิก</p>
  </div>
  <div class="receipt-title">ใบเสร็จรับเงิน</div>
  <div class="receipt-number">เลขที่ใบเสร็จ: %s</div>
  <div class="row"><span class="label">ชื่อสมาชิก</span><span class="value">%s %s</span></div>
  <div class="row"><span class="label">รหัสสมาชิก</span><span class="value">%s</span></div>
  <div class="row"><span class="label">ประเภทใบเสร็จ</span><span class="value">%s</span></div>
  <div class="row"><span class="label">วันที่</span><span class="value">%s</span></div>
  <div class="row"><span class="label">สถานะ</span><span class="value"><span class="status-badge">อนุมัติแล้ว</span></span></div>
  <div class="amount-row"><span>จำนวนเงิน</span><span>%.2f บาท</span></div>
  %s
  <div class="footer">ใบเสร็จนี้ออกโดยระบบอัตโนมัติ</div>
</div>
<script>window.onload = function(){ window.print(); }</script>
</body>
</html>`,
		receipt.ReceiptNumber,
		receipt.ReceiptNumber,
		member.FirstName, member.LastName,
		member.MembershipNo,
		receiptType.Name,
		receipt.IssueDate.Format("02/01/2006"),
		receipt.Amount,
		func() string {
			if receipt.Notes != "" {
				return fmt.Sprintf(`<div class="row"><span class="label">หมายเหตุ</span><span class="value">%s</span></div>`, receipt.Notes)
			}
			return ""
		}(),
	)

	c.Header("Content-Type", "text/html; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="receipt-%s.html"`, receipt.ReceiptNumber))
	c.String(http.StatusOK, html)
}
