import { create } from 'zustand';
import type { User } from '@/lib/api';

export type { User };

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: false,
  error: null,
  setUser: (user: User) => set({ user }),
  setAccessToken: (token: string) => set({ accessToken: token }),
  logout: () => set({ user: null, accessToken: null }),
  setError: (error: string | null) => set({ error }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
}));