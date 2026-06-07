'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser, IAuthTokens, IAuthResponse } from '@/types';
import api, { setTokens, clearTokens, getTokens } from '@/lib/api';

interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    businessName?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateUser: (user: Partial<IUser>) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          if (data.success && data.data) {
            const { user, tokens } = data.data as IAuthResponse;
            setTokens(tokens);
            set({ user, isAuthenticated: true, isLoading: false });
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (formData) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/register', formData);
          if (data.success && data.data) {
            const { user, tokens } = data.data as IAuthResponse;
            setTokens(tokens);
            set({ user, isAuthenticated: true, isLoading: false });
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        clearTokens();
        set({ user: null, isAuthenticated: false });
      },

      fetchProfile: async () => {
        const tokens = getTokens();
        if (!tokens) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          const { data } = await api.get('/auth/me');
          if (data.success && data.data) {
            set({ user: data.data as IUser, isAuthenticated: true });
          }
        } catch {
          clearTokens();
          set({ user: null, isAuthenticated: false });
        }
      },

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },
    }),
    {
      name: 'bb-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
