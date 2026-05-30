"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api/client";
import { User } from "@/types";

interface AuthContextType { user: User | null; loading: boolean; login: (token: string, user: User) => void; logout: () => void; refreshUser: () => Promise<void>; }

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, login: () => {}, logout: () => {}, refreshUser: async () => {} });

/** Auth provider — wraps app, manages user session */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) { api.auth.me().then(u => setUser(u)).catch(() => localStorage.removeItem("token")).finally(() => setLoading(false)); }
    else setLoading(false);
  }, []);

  const login = (token: string, u: User) => { localStorage.setItem("token", token); setUser(u); };
  const logout = () => { localStorage.removeItem("token"); setUser(null); window.location.href = "/"; };
  const refreshUser = async () => { try { setUser(await api.auth.me()); } catch { logout(); } };

  return <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>{children}</AuthContext.Provider>;
}

/** Hook to access auth context */
export const useAuth = () => useContext(AuthContext);
