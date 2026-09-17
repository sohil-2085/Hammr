import type { LoginResponse, RegisterResponse, TwoFactorSetupResponse } from '../types/auth';
import type { CreateListingInput } from '../types/listing';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

let accessToken: string | null = null;

const ACCESS_TOKEN_STORAGE_KEY = 'hammr_access_token';

export function setAccessToken(token: string | null) {
  accessToken = token;

  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  } else {
    sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  }
}

export function getAccessToken() {
  if (accessToken) {
    return accessToken;
  }

  if (typeof window !== 'undefined') {
    accessToken = sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  }

  return accessToken;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);

  headers.set('Content-Type', 'application/json');

  const currentToken = getAccessToken();

  if (currentToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${currentToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    throw new Error(body?.error?.message ?? 'Something went wrong.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json();

  return body.data as T;
}

export function get<T>(path: string) {
  return request<T>(path, {
    method: 'GET',
  });
}

export function register(data: {
  name: string;
  email: string;
  password: string;
  role: 'BUYER' | 'SELLER';
}) {
  return request<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function login(data: { email: string; password: string; twoFactorCode?: string }) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function setupTwoFactor(setupToken: string) {
  return request<TwoFactorSetupResponse>('/auth/2fa/setup', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${setupToken}`,
    },
  });
}

export function verifyTwoFactor(setupToken: string, code: string) {
  return request<LoginResponse>('/auth/2fa/verify', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${setupToken}`,
    },
    body: JSON.stringify({
      code,
    }),
  });
}

export function refresh(refreshToken: string) {
  return request<{
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: string;
    refreshTokenExpiresIn: string;
  }>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({
      refreshToken,
    }),
  });
}

export function logout(refreshToken: string) {
  return request<void>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({
      refreshToken,
    }),
  });
}

export async function logoutRequest(
  accessToken: string | null,
  refreshToken: string | null,
): Promise<void> {
  if (!refreshToken) {
    return;
  }

  const response = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {}),
    },
    body: JSON.stringify({
      refreshToken,
    }),
  });

  if (!response.ok) {
    let message = 'Logout failed.';

    try {
      const data = await response.json();

      if (data?.error?.message) {
        message = data.error.message;
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }
}

export function createListing(data: CreateListingInput) {
  return request('/listings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getListings<T>() {
  return request<T>('/listings', {
    method: 'GET',
  });
}

export function getMyListings<T = unknown>() {
  return request<T>('/listings/mine', {
    method: 'GET',
  });
}
