export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  twoFactorEnabled: boolean;
}

export interface AuthenticatedTokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface TwoFactorSetupRequiredResponse {
  requiresTwoFactorSetup: true;
  setupToken: string;
}

export interface TwoFactorRequiredResponse {
  requiresTwoFactor: true;
}

export interface AuthenticatedLoginResponse extends AuthenticatedTokenResponse {
  user: AuthUser;
}

export type LoginResponse =
  AuthenticatedLoginResponse | TwoFactorSetupRequiredResponse | TwoFactorRequiredResponse;

export interface AuthenticatedRegisterResponse extends AuthenticatedTokenResponse {
  user: AuthUser;
  requiresTwoFactorSetup: false;
}

export interface SellerRegisterResponse {
  user: AuthUser;
  requiresTwoFactorSetup: true;
  setupToken: string;
}

export type RegisterResponse = AuthenticatedRegisterResponse | SellerRegisterResponse;

export interface TwoFactorSetupResponse {
  qrCode: string;
  secret: string;
}
