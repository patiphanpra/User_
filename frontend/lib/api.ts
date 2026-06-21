import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface DataAxiosInstance extends Omit<AxiosInstance, 'get' | 'delete' | 'post' | 'put' | 'patch'> {
  (config: AxiosRequestConfig): Promise<any>;
  (url: string, config?: AxiosRequestConfig): Promise<any>;
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
}

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  code: string;
}

let isRefreshing = false;
let failedQueue: Array<{
  onSuccess: (token: string) => void;
  onFailure: (error: AxiosError) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.onFailure(error);
    } else if (token) {
      prom.onSuccess(token);
    }
  });

  failedQueue = [];
};

const redirectToLogin = () => {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
}) as DataAxiosInstance;

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((onSuccess, onFailure) => {
          failedQueue.push({ onSuccess, onFailure });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(() => {
            redirectToLogin();
            return Promise.reject(error);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post<{ access_token: string }>(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { access_token } = response.data;
        useAuthStore.setState({ accessToken: access_token });

        api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        processQueue(null, access_token);
        isRefreshing = false;
        return api(originalRequest);
      } catch (err) {
        processQueue(err as AxiosError, null);
        isRefreshing = false;
        useAuthStore.setState({ user: null, accessToken: null });
        redirectToLogin();
        return Promise.reject(err);
      }
    }

    const errorData: ApiError = error.response?.data as ApiError || {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด',
    };

    return Promise.reject(errorData);
  }
);

// Auth endpoints
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'staff' | 'member';
  status: 'active' | 'inactive' | 'suspended';
}

export const authApi = {
  login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    return api.post<{ access_token: string; user: User }>('/auth/login', { email, password });
  },

  memberLogin(national_id: string, phone: string): Promise<{ access_token: string; user: User }> {
    return api.post<{ access_token: string; user: User }>('/auth/member-login', { national_id, phone });
  },

  forgotPassword(phone: string): Promise<{ session_id: string }> {
    return api.post<{ session_id: string }>('/auth/forgot-password', { phone });
  },

  verifyOtp(sessionId: string, otp: string): Promise<{ session_id: string }> {
    return api.post<{ session_id: string }>('/auth/verify-otp', {
      session_id: sessionId,
      otp,
    });
  },

  resetPassword(sessionId: string, password: string): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/reset-password', {
      session_id: sessionId,
      password,
    });
  },

  refresh(): Promise<{ access_token: string }> {
    return api.post<{ access_token: string }>('/auth/refresh');
  },

  logout() {
    return api.post('/auth/logout');
  },

  me(): Promise<{ user: User }> {
    return api.get<{ user: User }>('/auth/me');
  },
};

// Member endpoints
export interface Member {
  id: string;
  membership_no: string;
  national_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone: string;
  email: string;
  address: string;
  occupation?: string;
  member_type: 'regular' | 'associate';
  status: 'active' | 'inactive' | 'suspended' | 'resigned' | 'deceased';
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export const memberApi = {
  list(page = 1, limit = 10, filters?: Record<string, string>): Promise<PaginatedResponse<Member>> {
    return api.get<PaginatedResponse<Member>>('/members', {
      params: { page, limit, ...filters },
    });
  },

  get(id: string): Promise<Member> {
    return api.get<Member>(`/members/${id}`);
  },

  create(data: Omit<Member, 'id' | 'created_at' | 'updated_at'>): Promise<Member> {
    return api.post<Member>('/members', data);
  },

  update(id: string, data: Partial<Member>): Promise<Member> {
    return api.put<Member>(`/members/${id}`, data);
  },

  delete(id: string): Promise<ApiResponse<{ message: string }>> {
    return api.delete<ApiResponse<{ message: string }>>(`/members/${id}`);
  },

  export(filters?: { status?: string; member_type?: string; search?: string }): Promise<Blob> {
    return api.get('/members/export/csv', { params: filters, responseType: 'blob' });
  },
};

// Receipt endpoints - extended
export const receiptDownloadApi = {
  download(id: string): Promise<Blob> {
    return api.get(`/receipts/${id}/download`, { responseType: 'blob' });
  },
};

// Receipt endpoints
export interface Receipt {
  id: string;
  receipt_number: string;
  member_id: string;
  receipt_type_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'void';
  issue_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ReceiptType {
  id: string;
  code: string;
  name: string;
  description: string;
  display_order: number;
}

export const receiptApi = {
  listTypes(): Promise<{ receipt_types: ReceiptType[] }> {
    return api.get<{ receipt_types: ReceiptType[] }>('/receipt-types');
  },

  list(page = 1, limit = 10, filters?: Record<string, string>): Promise<PaginatedResponse<Receipt>> {
    return api.get<PaginatedResponse<Receipt>>('/receipts', {
      params: { page, limit, ...filters },
    });
  },

  get(id: string): Promise<{ receipt: Receipt }> {
    return api.get<{ receipt: Receipt }>(`/receipts/${id}`);
  },

  create(data: Omit<Receipt, 'id' | 'status' | 'created_at' | 'updated_at'>): Promise<{ receipt: Receipt }> {
    return api.post<{ receipt: Receipt }>('/receipts', data);
  },

  update(id: string, data: Partial<Receipt>): Promise<{ receipt: Receipt }> {
    return api.put<{ receipt: Receipt }>(`/receipts/${id}`, data);
  },

  getMemberReceipts(memberId: string, page = 1, limit = 10): Promise<PaginatedResponse<Receipt>> {
    return api.get<PaginatedResponse<Receipt>>(`/members/${memberId}/receipts`, {
      params: { page, limit },
    });
  },
};

// File endpoints
interface FileRecord {
  id: string;
  member_id: string;
  file_type: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  description?: string;
  verification_status: 'pending' | 'verified' | 'rejected' | 'needsrevision';
  uploaded_at: string;
  verified_at?: string;
}

export const fileApi = {
  upload(memberId: string, formData: FormData, onUploadProgress?: (progress: number) => void): Promise<ApiResponse<{ file: FileRecord }>> {
    return api.post<ApiResponse<{ file: FileRecord }>>(`/members/${memberId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (event.total) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onUploadProgress?.(progress);
        }
      },
    });
  },

  list(memberId: string): Promise<ApiResponse<{ files: FileRecord[] }>> {
    return api.get<ApiResponse<{ files: FileRecord[] }>>(`/members/${memberId}/files`);
  },

  delete(memberId: string, fileId: string): Promise<ApiResponse<{ message: string }>> {
    return api.delete<ApiResponse<{ message: string }>>(`/members/${memberId}/files/${fileId}`);
  },

  download(memberId: string, fileId: string): Promise<Blob> {
    return api.get(`/members/${memberId}/files/${fileId}/download`, {
      responseType: 'blob',
    });
  },
};

// Death record endpoints
export interface DeathRecord {
  id: string;
  member_id: string;
  death_date: string;
  death_certificate_url?: string;
  death_location?: string;
  recorded_by: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const deathApi = {
  record(memberId: string, formData: FormData): Promise<{ death_record: DeathRecord }> {
    return api.post<{ death_record: DeathRecord }>(`/members/${memberId}/death-record`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  get(memberId: string): Promise<{ death_record: DeathRecord }> {
    return api.get<{ death_record: DeathRecord }>(`/members/${memberId}/death-record`);
  },
};

// Stats endpoints
export interface DashboardStats {
  total_members: number;
  active_members: number;
  deceased_members: number;
  pending_payments: number;
  recent_members: Member[];
  recent_receipts: Receipt[];
}

export const statsApi = {
  getDashboard(): Promise<DashboardStats> {
    return api
      .get<{ stats: DashboardStats }>('/stats/dashboard')
      .then((response: any) => (response.stats || response));
  },
};

export default api;