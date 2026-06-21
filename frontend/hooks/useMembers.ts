import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import {
  Member,
  CreateMemberDto,
  UpdateMemberDto,
  PaginatedResponse,
  PaginateParams,
} from '@/types/api';

// Queries
export function useMembers(params?: PaginateParams) {
  return useQuery({
    queryKey: ['members', params],
    queryFn: () => apiClient.get<PaginatedResponse<Member>>('/members', { params }),
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: ['members', id],
    queryFn: () => apiClient.get<Member>(`/members/${id}`),
    enabled: !!id,
  });
}

// Mutations
export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberData: CreateMemberDto) => {
      return apiClient.post<Member>('/members', memberData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useUpdateMember(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberData: UpdateMemberDto) => {
      return apiClient.put<Member>(`/members/${id}`, memberData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['members', id] });
    },
  });
}

export function useDeleteMember(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}
