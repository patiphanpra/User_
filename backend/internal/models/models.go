package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User represents system users (admins, staff)
type User struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	Email     string    `gorm:"uniqueIndex" json:"email"`
	Phone     string    `json:"phone"`
	Password  string    `json:"-"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Role      string    `json:"role"` // admin, staff
	Status    string    `json:"status"` // active, inactive
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	u.ID = uuid.New().String()
	return nil
}

// Member represents cooperative members
type Member struct {
	ID              string    `gorm:"primaryKey" json:"id"`
	MembershipNo    string    `gorm:"index" json:"membership_no"`
	Title           string    `json:"title"` // นาย, นาง, นางสาว
	FirstName       string    `json:"first_name"`
	LastName        string    `json:"last_name"`
	Email           string    `gorm:"index" json:"email"`
	Phone           string    `json:"phone"`
	DateOfBirth     time.Time `json:"date_of_birth"`
	IDCard          string    `json:"national_id"`
	Address         string    `json:"address"`
	District        string    `json:"district"`
	Province        string    `json:"province"`
	PostalCode      string    `json:"postal_code"`
	MemberType      string    `gorm:"default:regular" json:"member_type"` // regular, associate (สมาชิกทั่วไป, สมาชิกสมทบ)
	Status          string    `json:"status"` // active, inactive, suspended
	MembershipDate  time.Time `json:"membership_date"`
	VerificationStatus string  `json:"verification_status"` // pending, verified, rejected
	ProfileImageURL string    `json:"profile_image_url"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

func (m *Member) BeforeCreate(tx *gorm.DB) error {
	m.ID = uuid.New().String()
	return nil
}

// DeathRecord represents a member's death record (used for ค่าสมทบศพ)
type DeathRecord struct {
	ID                  string    `gorm:"primaryKey" json:"id"`
	MemberID            string    `gorm:"uniqueIndex" json:"member_id"`
	DeathDate           time.Time `json:"death_date"`
	DeathCertificateURL string    `json:"death_certificate_url"`
	DeathLocation       string    `json:"death_location"`
	RecordedBy          string    `json:"recorded_by"`
	Notes               string    `json:"notes"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

func (d *DeathRecord) BeforeCreate(tx *gorm.DB) error {
	d.ID = uuid.New().String()
	return nil
}

// OTP represents a forgot-password verification attempt, backed by
// ThaiBulkSMS's OTP API. ThaiBulkSMS generates the actual PIN, sends it,
// and verifies it on their end — we only ever hold their opaque
// ProviderToken, never the code itself. The record's ID doubles as the
// "session_id" the frontend carries through
// forgot-password -> verify-otp -> reset-password.
//
// This is for staff/admin only — members log in with national ID + phone
// and have no password to forget.
type OTP struct {
	ID            string     `gorm:"primaryKey" json:"id"`
	UserID        string     `gorm:"index" json:"user_id"`
	Phone         string     `gorm:"index" json:"phone"`
	ProviderToken string     `json:"-"` // ThaiBulkSMS's opaque token for this attempt; never exposed to the client
	Verified      bool       `json:"verified"`   // true once ThaiBulkSMS has confirmed the correct PIN was entered
	VerifiedAt    *time.Time `json:"verified_at"`
	Used          bool       `json:"used"`        // true once the password has actually been reset
	UsedAt        *time.Time `json:"used_at"`
	CreatedAt     time.Time  `json:"created_at"`
}

func (o *OTP) BeforeCreate(tx *gorm.DB) error {
	o.ID = uuid.New().String()
	return nil
}

// MemberDocument represents uploaded documents
type MemberDocument struct {
	ID             string    `gorm:"primaryKey" json:"id"`
	MemberID       string    `gorm:"index" json:"member_id"`
	DocumentType   string    `json:"document_type"` // id_card, thainoi, license
	DocumentURL    string    `json:"document_url"`
	UploadedBy     string    `json:"uploaded_by"`
	VerifiedBy     *string   `json:"verified_by"`
	VerificationStatus string `json:"verification_status"` // pending, verified, rejected
	Notes          string    `json:"notes"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (d *MemberDocument) BeforeCreate(tx *gorm.DB) error {
	d.ID = uuid.New().String()
	return nil
}

// Receipt represents a financial receipt
type Receipt struct {
	ID            string     `gorm:"primaryKey" json:"id"`
	ReceiptNumber string     `json:"receipt_number"`
	MemberID      string     `json:"member_id"`
	ReceiptTypeID string     `json:"receipt_type_id"`
	Amount        float64    `json:"amount"`
	IssueDate     time.Time  `json:"issue_date"`
	Status        string     `json:"status"`
	IssuedBy      *string    `json:"issued_by"`
	Notes         string     `json:"notes"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

func (r *Receipt) BeforeCreate(tx *gorm.DB) error {
	r.ID = uuid.New().String()
	return nil
}

// MemberFile represents an uploaded file for a member
type MemberFile struct {
	ID                 string     `gorm:"primaryKey" json:"id"`
	MemberID           string     `json:"member_id"`
	FileName           string     `json:"file_name"`
	FileType           string     `json:"file_type"`
	FileURL            string     `json:"file_url"`
	FileSize           int64      `json:"file_size"`
	MimeType           string     `json:"mime_type"`
	VerificationStatus string     `json:"verification_status"`
	UploadedBy         string     `json:"uploaded_by"`
	Description        string     `json:"description"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
	DeletedAt          *time.Time `json:"deleted_at,omitempty"`
}

func (f *MemberFile) BeforeCreate(tx *gorm.DB) error {
	f.ID = uuid.New().String()
	return nil
}

// ReceiptType represents types of receipts
type ReceiptType struct {
	ID           string    `gorm:"primaryKey" json:"id"`
	Code         string    `json:"code"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	DisplayOrder int       `json:"display_order"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
