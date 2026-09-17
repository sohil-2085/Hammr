'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { AuthUser, LoginResponse } from '@/types/auth';

import { getAccessToken, logout as logoutRequest, setAccessToken } from '@/lib/api';

interface AuthContextValue {
  user: AuthUser | null;
  refreshToken: string | null;
  login: (result: LoginResponse) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    // Access token is persisted in
    // sessionStorage by api.ts.
    //
    // We intentionally don't keep
    // another module-level in-memory
    // copy of the token.
    getAccessToken();
  }, []);

  function login(result: LoginResponse) {
    if ('user' in result && result.user && result.accessToken) {
      setUser(result.user);

      setAccessToken(result.accessToken);

      setRefreshToken(result.refreshToken ?? null);

      return;
    }

    // Login can also return a
    // 2FA/setup requirement.
    //
    // In those cases there is no
    // authenticated access token yet.
    setUser(null);
    setAccessToken(null);
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
