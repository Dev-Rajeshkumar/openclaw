import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, Business } from "@/types";
import {
  setTokens,
  clearTokens as clearApiTokens,
  setActiveBusiness,
  getActiveBusiness,
} from "@/lib/api";

interface AuthState {
  user: User | null;
  businesses: Business[];
  activeBusiness: Business | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setBusinesses: (businesses: Business[]) => void;
  setActiveBusinessById: (businessId: string) => void;
  login: (user: User, accessToken: string, refreshToken: string, businesses?: Business[]) => void;
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
        const storedId = getActiveBusiness();

        let activeBusiness = null;
        if (currentActive) {
          activeBusiness = businesses.find((b) => b.id === currentActive.id) || null;
        }
        if (!activeBusiness && storedId) {
          activeBusiness = businesses.find((b) => b.id === storedId) || null;
        }
        if (!activeBusiness && businesses.length > 0) {
          activeBusiness = businesses[0];
          setActiveBusiness(businesses[0].id);
        }

        set({ businesses, activeBusiness });
      },

      setActiveBusinessById: (businessId) => {
        const business = get().businesses.find((b) => b.id === businessId);
        if (business) {
          setActiveBusiness(businessId);
          set({ activeBusiness: business });
        }
      },

      login: (user, accessToken, refreshToken, businesses = []) => {
        setTokens(accessToken, refreshToken);

        const storedId = getActiveBusiness();
        let activeBusiness = null;
        if (storedId) {
          activeBusiness = businesses.find((b) => b.id === storedId) || null;
        }
        if (!activeBusiness && businesses.length > 0) {
          activeBusiness = businesses[0];
          setActiveBusiness(businesses[0].id);
        }

        set({
          user,
          isAuthenticated: true,
          businesses,
          activeBusiness,
        });
      },

      logout: () => {
        clearApiTokens();
        set({
          user: null,
          isAuthenticated: false,
          businesses: [],
          activeBusiness: null,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),
      setHydrated: (isHydrated) => set({ isHydrated }),
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

// Hook for auth actions that need API calls
export function useAuth() {
  const store = useAuthStore();

  return {
    user: store.user,
    businesses: store.businesses,
    activeBusiness: store.activeBusiness,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    isHydrated: store.isHydrated,
    login: store.login,
    logout: store.logout,
    setUser: store.setUser,
    setBusinesses: store.setBusinesses,
    setActiveBusinessById: store.setActiveBusinessById,
    setLoading: store.setLoading,
  };
}
