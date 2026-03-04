'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
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
  login: (loginIdentifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; username: string; password: string; password2: string; first_name?: string; last_name?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'caryvn_token';
const REFRESH_KEY = 'caryvn_refresh';

// Refresh the access token 5 minutes before the 30-minute expiry
const REFRESH_INTERVAL_MS = 25 * 60 * 1000; // 25 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshTokenState, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ref to hold the refresh timer so it can be cleared on logout/unmount
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const stopRefreshTimer = () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  /**
   * Silently exchange the stored refresh token for a new access token.
   * Called proactively every 25 minutes so API calls never hit an expired token.
   */
  const silentRefresh = useCallback(async () => {
    const storedRefresh = localStorage.getItem(REFRESH_KEY);
    if (!storedRefresh) {
      stopRefreshTimer();
      return;
    }
    try {
      const result = await authApi.refreshToken(storedRefresh);
      if (result.data) {
        const { access, refresh } = result.data as { access: string; refresh?: string };
        setToken(access);
        localStorage.setItem(TOKEN_KEY, access);
        // Django rotates refresh tokens — update if a new one was returned
        if (refresh) {
          setRefreshToken(refresh);
          localStorage.setItem(REFRESH_KEY, refresh);
        }
      } else {
        // Refresh token is invalid / blacklisted — force logout
        handleLogoutCleanup();
      }
    } catch {
      // Network error — don't log out, just let the next interval try again
    }
  }, []);

  /**
   * Start the proactive refresh timer.
   * Always clears any existing timer first to avoid duplicates.
   */
  const startRefreshTimer = useCallback(() => {
    stopRefreshTimer();
    refreshTimerRef.current = setInterval(silentRefresh, REFRESH_INTERVAL_MS);
  }, [silentRefresh]);

  // ── Auth state bootstrap ─────────────────────────────────────────────────

  // Initialize auth state from localStorage on first mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedRefresh = localStorage.getItem(REFRESH_KEY);

    if (storedToken && storedRefresh) {
      setToken(storedToken);
      setRefreshToken(storedRefresh);
      fetchUser(storedToken, storedRefresh);
    } else {
      setIsLoading(false);
    }

    // Cleanup on unmount
    return () => stopRefreshTimer();
  }, []);

  // ── Core functions ────────────────────────────────────────────────────────

  const fetchUser = async (accessToken: string, refreshTkn?: string) => {
    try {
      const result = await authApi.getProfile(accessToken);
      if (result.data) {
        setUser(result.data as User);
        // Start the proactive refresh timer once we confirm the user is valid
        startRefreshTimer();
      } else if (result.status === 401) {
        // Access token expired — try to refresh immediately
        const storedRefresh = refreshTkn ?? localStorage.getItem(REFRESH_KEY);
        if (storedRefresh) {
          const refreshResult = await authApi.refreshToken(storedRefresh);
          if (refreshResult.data) {
            const { access, refresh } = refreshResult.data as { access: string; refresh?: string };
            setToken(access);
            localStorage.setItem(TOKEN_KEY, access);
            if (refresh) {
              setRefreshToken(refresh);
              localStorage.setItem(REFRESH_KEY, refresh);
            }
            await fetchUser(access);
            return;
          }
        }
        // Refresh also failed — clean up
        handleLogoutCleanup();
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutCleanup = () => {
    stopRefreshTimer();
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  };

  // ── Public API ────────────────────────────────────────────────────────────

  const login = async (loginIdentifier: string, password: string) => {
    try {
      const result = await authApi.login({ login: loginIdentifier, password });

      if (result.data) {
        const data = result.data as { user: User; tokens: { access: string; refresh: string } };
        setUser(data.user);
        setToken(data.tokens.access);
        setRefreshToken(data.tokens.refresh);
        localStorage.setItem(TOKEN_KEY, data.tokens.access);
        localStorage.setItem(REFRESH_KEY, data.tokens.refresh);
        // Start timer fresh on every login
        startRefreshTimer();
        return { success: true };
      }

      return { success: false, error: result.error || 'Login failed' };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (data: { email: string; username: string; password: string; password2: string; first_name?: string; last_name?: string }) => {
    try {
      const result = await authApi.register(data);

      if (result.data) {
        const responseData = result.data as { user: User; tokens: { access: string; refresh: string } };
        setUser(responseData.user);
        setToken(responseData.tokens.access);
        setRefreshToken(responseData.tokens.refresh);
        localStorage.setItem(TOKEN_KEY, responseData.tokens.access);
        localStorage.setItem(REFRESH_KEY, responseData.tokens.refresh);
        startRefreshTimer();
        return { success: true };
      }

      return { success: false, error: result.error || 'Registration failed' };
    } catch {
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
