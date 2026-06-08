import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IUser, IBusiness } from "@/types";
import {
  setTokens,
  clearTokens as clearApiTokens,
  setActiveBusiness,
  getActiveBusiness,
} from "@/lib/api";

interface AuthState {
  user: IUser | null;
  businesses: IBusiness[];
  activeBusiness: IBusiness | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;

  setUser: (user: IUser | null) => void;
  setBusinesses: (businesses: IBusiness[]) => void;
  setActiveBusiness: (business: IBusiness) => void;
  updateUser: (data: Partial<IUser>) => void;
  fetchProfile: () => Promise<void>;
  fetchBusinesses: () => Promise<void>;
  login: (user: IUser, accessToken: string, refreshToken: string, businesses?: IBusiness[]) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      businesses: [],
      activeBusiness: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setBusinesses: (businesses) => {
        const currentActive = get().activeBusiness;
        let activeBusiness = null;
        if (currentActive) {
          activeBusiness = businesses.find((b) => b.id === currentActive.id) || null;
        }
        if (!activeBusiness) {
          const storedId = getActiveBusiness();
          if (storedId) activeBusiness = businesses.find((b) => b.id === storedId) || null;
        }
        if (!activeBusiness && businesses.length > 0) {
          activeBusiness = businesses[0];
          setActiveBusiness(businesses[0].id);
        }
        set({ businesses, activeBusiness });
      },

      setActiveBusiness: (business: IBusiness) => {
        setActiveBusiness(business.id);
        set({ activeBusiness: business });
      },

      updateUser: (data) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...data } });
      },

      fetchProfile: async () => {
        // Placeholder — API call would go here
      },

      fetchBusinesses: async () => {
        // Placeholder — API call would go here
      },

      login: (user, accessToken, refreshToken, businesses = []) => {
        setTokens(accessToken, refreshToken);
        let activeBusiness = null;
        const storedId = getActiveBusiness();
        if (storedId) activeBusiness = businesses.find((b) => b.id === storedId) || null;
        if (!activeBusiness && businesses.length > 0) {
          activeBusiness = businesses[0];
          setActiveBusiness(businesses[0].id);
        }
        set({ user, isAuthenticated: true, businesses, activeBusiness });
      },

      logout: () => {
        clearApiTokens();
        set({ user: null, isAuthenticated: false, businesses: [], activeBusiness: null });
      },

      setLoading: (isLoading) => set({ isLoading }),
      setHydrated: (hydrated) => set({ isHydrated: true }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        businesses: state.businesses,
        activeBusiness: state.activeBusiness,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

export function useAuth() {
  return useAuthStore();
}
