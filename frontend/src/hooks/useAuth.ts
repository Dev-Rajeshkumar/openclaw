'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser, IAuthTokens, IAuthResponse, IBusiness } from '@/types';
import api, { setTokens, clearTokens, getTokens, setBusinessId, getBusinessId } from '@/lib/api';

interface AuthState {
  user: IUser | null;
  businesses: IBusiness[];
  activeBusiness: IBusiness | null;
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
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  fetchBusinesses: () => Promise<void>;
  setActiveBusiness: (business: IBusiness) => void;
  updateUser: (user: Partial<IUser>) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      businesses: [],
      activeBusiness: null,
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
            // Fetch businesses after login
            await get().fetchBusinesses();
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
            await get().fetchBusinesses();
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      googleLogin: async (idToken) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/google', { idToken });
          if (data.success && data.data) {
            const { user, tokens } = data.data as IAuthResponse;
            setTokens(tokens);
            set({ user, isAuthenticated: true, isLoading: false });
            await get().fetchBusinesses();
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        clearTokens();
        set({ user: null, businesses: [], activeBusiness: null, isAuthenticated: false });
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

      fetchBusinesses: async () => {
        try {
          const { data } = await api.get('/businesses');
          if (data.success && data.data) {
            const businesses = data.data as IBusiness[];
            // Check if saved businessId is still valid
            const savedBusinessId = getBusinessId();
            const savedBusiness = businesses.find((b) => b.id === savedBusinessId);
            const activeBusiness = savedBusiness || businesses[0] || null;
            if (activeBusiness) {
              setBusinessId(activeBusiness.id);
            }
            set({ businesses, activeBusiness });
          }
        } catch (error) {
          console.error('Failed to fetch businesses:', error);
        }
      },

      setActiveBusiness: (business) => {
        setBusinessId(business.id);
        set({ activeBusiness: business });
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
