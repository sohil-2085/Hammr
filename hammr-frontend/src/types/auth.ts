export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  twoFactorEnabled: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface LoginResponse {
  user?: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresIn?: string;
  refreshTokenExpiresIn?: string;
  requiresTwoFactor?: boolean;
  requiresTwoFactorSetup?: boolean;
  setupToken?: string;
}

export interface RegisterResponse {
  user: AuthUser;
  requiresTwoFactorSetup: boolean;
  setupToken?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresIn?: string;
  refreshTokenExpiresIn?: string;
}

export interface TwoFactorSetupResponse {
  qrCode: string;
  secret: string;
}

