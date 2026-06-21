'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const router = useRouter();
  const { user, setUser, setAccessToken, setError, setLoading } = useAuthStore();

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await authApi.me();
      return response.user;
    },
    enabled: !!useAuthStore.getState().accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (data && !user) {
      setUser(data);
    }
  }, [data, user, setUser]);

  useEffect(() => {
    if (isError && error) {
      setError(error.toString());
      router.push('/login');
    }
  }, [isError, error, setError, router]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { access_token, user } = await authApi.login(email, password);

      setAccessToken(access_token);
      setUser(user);
      setError(null);

      router.push(user.role === 'admin' || user.role === 'staff' ? '/dashboard' : '/profile');
      return { success: true };
    } catch (err: any) {
      const message = err.message || 'เข้าสู่ระบบล้มเหลว';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // Silently fail
    } finally {
      useAuthStore.setState({ user: null, accessToken: null });
      router.push('/login');
    }
  };

  return {
    user: user || data,
    isLoading,
    isError,
    error,
    login,
    logout,
  };
};