// ============================================
// Authentication context and hook
// ============================================

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, storage } from '../lib/api';

interface User {
  id: string;
  phone: string;
  paymentPhone?: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  language: string;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string) => Promise<{ devOtp?: string }>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({}),
  verifyOtp: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = storage.getAccessToken();
    if (token) {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (e) {
        storage.clearTokens();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string) => {
    const response = await api.requestOtp(email) as any;
    return { devOtp: response.devOtp as string | undefined };
  };

  const verifyOtp = async (email: string, code: string) => {
    const response = await api.verifyOtp(email, code) as {
      accessToken: string;
      refreshToken: string;
      user: User;
    };

    storage.setAccessToken(response.accessToken);
    storage.setRefreshToken(response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
    redirectByRole(response.user);
  };

  const redirectByRole = (user: User) => {
    if (typeof window === 'undefined') return;
    if (user.role === 'DELIVERY_PERSON') {
      window.location.href = '/deliverer/dashboard';
    } else if (user.role === 'ADMIN') {
      window.location.href = '/admin/dashboard';
    } else {
      window.location.href = '/';
    }
  };

  const logout = () => {
    const token = storage.getAccessToken();
    if (token && user) {
      api.logout(user.id, token).catch(console.error);
    }
    storage.clearTokens();
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
