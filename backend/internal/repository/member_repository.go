package repository

import (
	"fmt"
	"regexp"
	"strconv"

	"github.com/member-mgmt-system/backend/internal/models"
	"gorm.io/gorm"
)

type MemberRepository struct {
	db *gorm.DB
}

func NewMemberRepository(db *gorm.DB) *MemberRepository {
	return &MemberRepository{db: db}
}

func (r *MemberRepository) Create(member *models.Member) error {
	return r.db.Create(member).Error
}

// Matches the new sequential format only: M followed by exactly 7 digits
// (e.g. M0000001). Legacy timestamp-based numbers like M1775681286901 (13
// digits) intentionally do not match, so they're ignored when computing
// the next sequence number instead of inflating it.
var membershipNoDigits = regexp.MustCompile(`^M(\d{7})$`)

// Arbitrary but fixed key for the advisory lock guarding membership number
// assignment. Any int64 works as long as it's not reused for an unrelated
// purpose elsewhere in the codebase.
const membershipNoLockKey = 851001

// nextMembershipNo computes the next sequential membership number
// (e.g. "M0000043") given the set of existing membership numbers already
// in the database. It's a pure function — no DB access — specifically so
// the parsing/max-finding logic can be unit tested in isolation from the
// advisory-lock and transaction concerns in CreateWithSequentialNo.
func nextMembershipNo(existing []string) string {
	maxN := 0
	for _, no := range existing {
		m := membershipNoDigits.FindStringSubmatch(no)
		if m == nil {
			continue
		}
		n, err := strconv.Atoi(m[1])
		if err != nil {
			continue
		}
		if n > maxN {
			maxN = n
		}
	}
	return fmt.Sprintf("M%07d", maxN+1)
}

// CreateWithSequentialNo assigns the next sequential membership number
// (M0000001, M0000002, ...) and creates the member in a single transaction.
//
// Note: a plain "SELECT ... FOR UPDATE" only locks rows that already exist —
// it does NOT block a concurrent transaction from computing the same "next"
// number, because there's no existing row representing that future number
// for it to collide with. Two simultaneous requests would both read the
// same max and both try to insert the same membership_no, hitting the
// unique constraint. A Postgres advisory lock (pg_advisory_xact_lock) has
// no such gap: it serializes the entire read-compute-insert section itself,
// not just access to existing rows, and is released automatically when the
// transaction commits or rolls back.
func (r *MemberRepository) CreateWithSequentialNo(member *models.Member) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec("SELECT pg_advisory_xact_lock(?)", membershipNoLockKey).Error; err != nil {
			return err
		}

		var existing []string
		if err := tx.Model(&models.Member{}).
			Where("membership_no LIKE ?", "M%").
			Pluck("membership_no", &existing).Error; err != nil {
			return err
		}

		member.MembershipNo = nextMembershipNo(existing)
		return tx.Create(member).Error
	})
}

func (r *MemberRepository) GetByID(id string) (*models.Member, error) {
	var member models.Member
	if err := r.db.First(&member, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &member, nil
}

func (r *MemberRepository) GetByEmail(email string) (*models.Member, error) {
	var member models.Member
	if err := r.db.First(&member, "email = ?", email).Error; err != nil {
		return nil, err
	}
	return &member, nil
}

// MemberFilter holds optional filter criteria for listing members.
// Empty fields are not applied as filter conditions.
type MemberFilter struct {
	Status     string // exact match on members.status
	MemberType string // exact match on members.member_type (regular, associate)
	Search     string // matches first_name, last_name, or phone (case-insensitive, partial)
}

func (r *MemberRepository) GetAll(limit, offset int) ([]models.Member, int64, error) {
	return r.GetAllFiltered(limit, offset, MemberFilter{})
}

// GetAllFiltered lists members with pagination, optionally narrowed by
// status, member type, and/or a search term. Both the count and the page
// query use the same WHERE conditions, so total_pages stays consistent
// with what's actually returned.
func (r *MemberRepository) GetAllFiltered(limit, offset int, filter MemberFilter) ([]models.Member, int64, error) {
	var members []models.Member
	var total int64

	query := r.db.Model(&models.Member{})

	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.MemberType != "" {
		query = query.Where("member_type = ?", filter.MemberType)
	}
	if filter.Search != "" {
		like := "%" + filter.Search + "%"
		query = query.Where(
			"first_name ILIKE ? OR last_name ILIKE ? OR phone ILIKE ?",
			like, like, like,
		)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Limit(limit).Offset(offset).Find(&members).Error; err != nil {
		return nil, 0, err
	}

	return members, total, nil
}

func (r *MemberRepository) Update(member *models.Member) error {
	return r.db.Save(member).Error
}

func (r *MemberRepository) Delete(id string) error {
	return r.db.Delete(&models.Member{}, "id = ?", id).Error
}

// GetAllForExport returns all members matching filter (no pagination —
// export should include every matching row), ordered the same way as the
// list view. Using the same MemberFilter as GetAllFiltered guarantees the
// CSV export always reflects exactly what's currently shown on screen.
func (r *MemberRepository) GetAllForExport(filter MemberFilter) ([]models.Member, error) {
	var members []models.Member

	query := r.db.Model(&models.Member{})

	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.MemberType != "" {
		query = query.Where("member_type = ?", filter.MemberType)
	}
	if filter.Search != "" {
		like := "%" + filter.Search + "%"
		query = query.Where(
			"first_name ILIKE ? OR last_name ILIKE ? OR phone ILIKE ?",
			like, like, like,
		)
	}

	if err := query.Order("created_at DESC").Find(&members).Error; err != nil {
		return nil, err
	}
	return members, nil
}

func (r *MemberRepository) GetByMembershipNo(membershipNo string) (*models.Member, error) {
	var member models.Member
	if err := r.db.First(&member, "membership_no = ?", membershipNo).Error; err != nil {
		return nil, err
	}
	return &member, nil
}
