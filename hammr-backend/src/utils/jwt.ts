import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRole } from '@prisma/client';
import { env } from './env.js';

export interface AccessTokenPayload {
  userId: string;
  role: UserRole;
  type: 'access';
}

export interface RefreshTokenPayload {
  userId: string;
  type: 'refresh';
  tokenId: string;
}

export interface TwoFactorSetupTokenPayload {
  userId: string;
  role: UserRole;
  type: '2fa_setup';
}

export function createAccessToken(userId: string, role: UserRole): string {
  const payload: AccessTokenPayload = {
    userId,
    role,
    type: 'access',
  };

  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: '1d',
  });
}

export function createRefreshToken(userId: string, tokenId: string): string {
  const payload: RefreshTokenPayload = {
    userId,
    tokenId,
    type: 'refresh',
  };

  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: '7d',
  });
}

export function createTwoFactorSetupToken(userId: string, role: UserRole): string {
  const payload: TwoFactorSetupTokenPayload = {
    userId,
    role,
    type: '2fa_setup',
  };

  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: '15m',
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;

  if (payload.type !== 'access') {
    throw new Error('Invalid access token');
  }

  return payload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, env.jwtRefreshSecret) as RefreshTokenPayload;

  if (payload.type !== 'refresh') {
    throw new Error('Invalid refresh token');
  }

  return payload;
}

export function verifyTwoFactorSetupToken(token: string): TwoFactorSetupTokenPayload {
  const payload = jwt.verify(token, env.jwtAccessSecret) as TwoFactorSetupTokenPayload;

  if (payload.type !== '2fa_setup') {
    throw new Error('Invalid 2FA setup token');
  }

  return payload;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
