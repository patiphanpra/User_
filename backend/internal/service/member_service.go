package service

import (
	"github.com/member-mgmt-system/backend/internal/models"
	"github.com/member-mgmt-system/backend/internal/repository"
)

type MemberService struct {
	memberRepo *repository.MemberRepository
}

func NewMemberService(memberRepo *repository.MemberRepository) *MemberService {
	return &MemberService{
		memberRepo: memberRepo,
	}
}

func (s *MemberService) CreateMember(member *models.Member) error {
	return s.memberRepo.CreateWithSequentialNo(member)
}

func (s *MemberService) GetMemberByID(id string) (*models.Member, error) {
	return s.memberRepo.GetByID(id)
}

func (s *MemberService) GetMemberByEmail(email string) (*models.Member, error) {
	return s.memberRepo.GetByEmail(email)
}

func (s *MemberService) GetAllMembers(limit, offset int) ([]models.Member, int64, error) {
	return s.memberRepo.GetAll(limit, offset)
}

func (s *MemberService) GetAllMembersFiltered(limit, offset int, filter repository.MemberFilter) ([]models.Member, int64, error) {
	return s.memberRepo.GetAllFiltered(limit, offset, filter)
}

func (s *MemberService) UpdateMember(member *models.Member) error {
	return s.memberRepo.Update(member)
}

func (s *MemberService) DeleteMember(id string) error {
	return s.memberRepo.Delete(id)
}
