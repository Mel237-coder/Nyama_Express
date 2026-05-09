// ============================================
// Authentication context and hook
// ============================================

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, storage } from '../lib/api';

interface User {
  id: string;
  phone: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  language: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  verifyOtp: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = storage.getAccessToken();
    if (token) {
      // Validate token and get user (simplified)
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

  const login = async (phone: string) => {
    const response = await api.requestOtp(phone);
    return response;
  };

  const verifyOtp = async (phone: string, code: string) => {
    const response = await api.verifyOtp(phone, code) as {
      accessToken: string;
      refreshToken: string;
      user: User;
    };

    storage.setAccessToken(response.accessToken);
    storage.setRefreshToken(response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
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