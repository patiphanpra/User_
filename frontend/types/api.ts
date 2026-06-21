// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

// Member Types
export interface Member {
  id: string;
  membershipNo: string;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  idCard: string;
  address: string;
  district: string;
  province: string;
  postalCode: string;
  status: 'active' | 'inactive' | 'suspended';
  membershipDate: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemberDto {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  idCard: string;
  address: string;
  district: string;
  province: string;
  postalCode: string;
}

export interface UpdateMemberDto extends Partial<CreateMemberDto> {
  status?: 'active' | 'inactive' | 'suspended';
}

// User type lives in lib/api.ts (matches backend's snake_case field names
// and includes the 'member' role used by /auth/member-login)

// Auth Types
export interface OtpRequest {
  phone: string;
}

export interface OtpVerify {
  phone: string;
  code: string;
}

export interface TokenRefresh {
  accessToken: string;
}

// Pagination
export interface PaginateParams {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Document Types
export interface MemberDocument {
  id: string;
  memberId: string;
  documentType: string;
  documentUrl: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  uploadedBy: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadDocumentDto {
  documentType: string;
  file: File;
}

// Error Response
export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, string>;
  timestamp: string;
}