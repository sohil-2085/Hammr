'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { AuthUser, LoginResponse } from '@/types/auth';

import {
  getAccessToken,
  getRefreshToken,
  logout as logoutRequest,
  refresh as refreshRequest,
  setAccessToken,
  setRefreshToken,
} from '@/lib/api';

interface AuthContextValue {
  user: AuthUser | null;
  refreshToken: string | null;
  login: (result: LoginResponse) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const [refreshToken, setRefreshTokenState] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const storedAccessToken = getAccessToken();
      const storedRefreshToken = getRefreshToken();

      if (!storedRefreshToken) {
        if (!storedAccessToken) {
          setUser(null);
        }

        return;
      }

      try {
        const result = await refreshRequest(storedRefreshToken);

        if (cancelled) {
          return;
        }

        setAccessToken(result.accessToken);
        setRefreshToken(result.refreshToken);
        setRefreshTokenState(result.refreshToken);
        setUser(result.user);
      } catch {
        if (cancelled) {
          return;
        }

        setAccessToken(null);
        setRefreshToken(null);
        setRefreshTokenState(null);
        setUser(null);
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  function login(result: LoginResponse) {
    if ('user' in result && result.user && result.accessToken) {
      setUser(result.user);

      setAccessToken(result.accessToken);

      if (result.refreshToken) {
        setRefreshToken(result.refreshToken);
        setRefreshTokenState(result.refreshToken);
      }

      return;
    }

    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setRefreshTokenState(null);
  }

  async function logout() {
    const accessToken = getAccessToken();

    try {
      if (accessToken && refreshToken) {
        await logoutRequest(accessToken, refreshToken);
      }
    } finally {
      setAccessToken(null);
      setRefreshToken(null);
      setRefreshTokenState(null);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        refreshToken,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
