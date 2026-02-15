'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  balance: string;
  is_verified: boolean;
  date_joined: string;
  api_key: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; password: string; password2: string; first_name?: string; last_name?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'caryvn_token';
const REFRESH_KEY = 'caryvn_refresh';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshTokenState, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedRefresh = localStorage.getItem(REFRESH_KEY);
    
    if (storedToken && storedRefresh) {
      setToken(storedToken);
      setRefreshToken(storedRefresh);
      fetchUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (accessToken: string) => {
    try {
      const result = await authApi.getProfile(accessToken);
      if (result.data) {
        setUser(result.data as User);
      } else if (result.status === 401) {
        // Token expired, try refresh
        const storedRefresh = localStorage.getItem(REFRESH_KEY);
        if (storedRefresh) {
          const refreshResult = await authApi.refreshToken(storedRefresh);
          if (refreshResult.data) {
            const newToken = (refreshResult.data as { access: string }).access;
            setToken(newToken);
            localStorage.setItem(TOKEN_KEY, newToken);
            await fetchUser(newToken);
            return;
          }
        }
        // Refresh failed, logout
        handleLogoutCleanup();
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutCleanup = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await authApi.login({ email, password });
      
      if (result.data) {
        const data = result.data as { user: User; tokens: { access: string; refresh: string } };
        setUser(data.user);
        setToken(data.tokens.access);
        setRefreshToken(data.tokens.refresh);
        localStorage.setItem(TOKEN_KEY, data.tokens.access);
        localStorage.setItem(REFRESH_KEY, data.tokens.refresh);
        return { success: true };
      }
      
      return { success: false, error: result.error || 'Login failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (data: { email: string; password: string; password2: string; first_name?: string; last_name?: string }) => {
    try {
      const result = await authApi.register(data);
      
      if (result.data) {
        const responseData = result.data as { user: User; tokens: { access: string; refresh: string } };
        setUser(responseData.user);
        setToken(responseData.tokens.access);
        setRefreshToken(responseData.tokens.refresh);
        localStorage.setItem(TOKEN_KEY, responseData.tokens.access);
        localStorage.setItem(REFRESH_KEY, responseData.tokens.refresh);
        return { success: true };
      }
      
      return { success: false, error: result.error || 'Registration failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    if (refreshTokenState && token) {
      await authApi.logout(refreshTokenState, token);
    }
    handleLogoutCleanup();
  };

  const refreshUser = useCallback(async () => {
    if (token) {
      await fetchUser(token);
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken: refreshTokenState,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
