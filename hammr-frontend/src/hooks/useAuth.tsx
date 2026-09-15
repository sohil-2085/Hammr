'use client';

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

import { AuthUser, LoginResponse } from '@/types/auth';
import {
  logout as logoutRequest,
  setAccessToken,
} from '@/lib/api';

interface AuthContextValue {
  user: AuthUser | null;
  refreshToken: string | null;
  login: (result: LoginResponse) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(
    null,
  );

  function login(result: LoginResponse) {
    if (result.user && result.accessToken) {
      setUser(result.user);

      setAccessToken(result.accessToken);

      setRefreshToken(result.refreshToken ?? null);
    }
  }

  async function logout() {
    try {
      if (refreshToken) {
        await logoutRequest(refreshToken);
      }
    } finally {
      // Clear the frontend authentication state
      // even if the backend logout request fails.
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
    throw new Error(
      'useAuth must be used inside AuthProvider.',
    );
  }

  return context;
}