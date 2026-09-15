import crypto from 'crypto';
import { UserRole } from '@prisma/client';
import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';

import { prisma } from '../prisma/client.js';
import {
  createAccessToken,
  createRefreshToken,
  createTwoFactorSetupToken,
  hashToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { decryptSecret, encryptSecret } from '../utils/crypto.js';

const ACCESS_TOKEN_EXPIRES_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function issueTokens(userId: string, role: UserRole) {
  const tokenId = crypto.randomUUID();

  const accessToken = createAccessToken(userId, role);

  const refreshToken = createRefreshToken(userId, tokenId);

  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      tokenHash: hashToken(refreshToken),
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
    },
  });

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: '15m',
    refreshTokenExpiresIn: '7d',
  };
}

export async function register(
  name: string,
  email: string,
  password: string,
  role: 'BUYER' | 'SELLER',
) {
  validatePassword(password);

  const normalizedEmail = normalizeEmail(email);

  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingUser) {
    throw new Error('An account with this email already exists.');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      twoFactorEnabled: false,
    },
  });

  if (role === 'SELLER') {
    const setupToken = createTwoFactorSetupToken(user.id, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      requiresTwoFactorSetup: true,
      setupToken,
    };
  }

  const tokens = await issueTokens(user.id, user.role);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
    },
    requiresTwoFactorSetup: false,
    ...tokens,
  };
}

export async function login(email: string, password: string, twoFactorCode?: string) {
  const normalizedEmail = normalizeEmail(email);

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const passwordValid = await comparePassword(password, user.passwordHash);

  if (!passwordValid) {
    throw new Error('Invalid email or password.');
  }

  if (user.role === 'SELLER') {
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return {
        requiresTwoFactorSetup: true,
        setupToken: createTwoFactorSetupToken(user.id, user.role),
      };
    }

    if (!twoFactorCode) {
      return {
        requiresTwoFactor: true,
      };
    }

    const secret = decryptSecret(user.twoFactorSecret);

    const validCode = await verify({
      token: twoFactorCode,
      secret,
    });

    if (!validCode) {
      throw new Error('Invalid 2FA code.');
    }
  }

  const tokens = await issueTokens(user.id, user.role);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
    },
    ...tokens,
  };
}

export async function setupTwoFactor(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error('User not found.');
  }

  if (user.role !== 'SELLER') {
    throw new Error('Two-factor authentication setup is only available for sellers.');
  }

  const secret = generateSecret();

  const otpauthUrl = generateURI({
    issuer: 'Hammr',
    label: user.email,
    secret,
  });

  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      twoFactorSecret: encryptSecret(secret),
    },
  });

  return {
    qrCode: qrCodeDataUrl,
    secret,
  };
}

export async function verifyTwoFactor(userId: string, code: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error('User not found.');
  }

  if (user.role !== 'SELLER') {
    throw new Error('Two-factor authentication is only available for sellers.');
  }

  if (!user.twoFactorSecret) {
    throw new Error('Two-factor authentication setup has not been started.');
  }

  const secret = decryptSecret(user.twoFactorSecret);

  const valid = await verify({
    token: code,
    secret,
  });

  if (!valid) {
    throw new Error('Invalid 2FA code.');
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      twoFactorEnabled: true,
    },
  });

  return {
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      twoFactorEnabled: updatedUser.twoFactorEnabled,
    },
  };
}

export async function refresh(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);

  const tokenRecord = await prisma.refreshToken.findUnique({
    where: {
      id: payload.tokenId,
    },
  });

  if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt <= new Date()) {
    throw new Error('Refresh token is invalid or expired.');
  }

  if (tokenRecord.tokenHash !== hashToken(refreshToken)) {
    throw new Error('Refresh token is invalid.');
  }

  await prisma.refreshToken.update({
    where: {
      id: tokenRecord.id,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  const user = await prisma.user.findUnique({
    where: {
      id: payload.userId,
    },
  });

  if (!user) {
    throw new Error('User no longer exists.');
  }

  return issueTokens(user.id, user.role);
}

export async function logout(refreshToken: string) {
  try {
    const payload = verifyRefreshToken(refreshToken);

    await prisma.refreshToken.updateMany({
      where: {
        id: payload.tokenId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  } catch {
    // Logout should remain idempotent.
  }
}

export async function loginAfterTwoFactor(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error('User no longer exists.');
  }

  if (user.role !== 'SELLER' || !user.twoFactorEnabled) {
    throw new Error('Seller 2FA verification is required.');
  }

  return issueTokens(user.id, user.role);
}
