import crypto from 'crypto';
import { TokenType, UserRole } from '@prisma/client';
import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';

import { prisma } from '../prisma/client.js';

import {
  createAccessToken,
  createRefreshToken,
  createTwoFactorSetupToken,
  hashToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../utils/jwt.js';

import { comparePassword, hashPassword } from '../utils/password.js';

import { decryptSecret, encryptSecret } from '../utils/crypto.js';

const ACCESS_TOKEN_EXPIRES_MS = 24 * 60 * 60 * 1000;

const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

const TWO_FACTOR_TOKEN_EXPIRES_MS = 15 * 60 * 1000;

function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  twoFactorEnabled: boolean;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled,
  };
}

/**
 * Creates a temporary TWO_FACTOR token record.
 *
 * The JWT itself is returned to the caller.
 * Only the SHA-256 hash is stored in PostgreSQL.
 */
async function createTwoFactorToken(userId: string, role: UserRole): Promise<string> {
  const tokenId = crypto.randomUUID();

  const token = createTwoFactorSetupToken(userId, role, tokenId);

  await prisma.token.create({
    data: {
      id: tokenId,
      tokenHash: hashToken(token),
      type: TokenType.TWO_FACTOR,
      userId,
      expiresAt: new Date(Date.now() + TWO_FACTOR_TOKEN_EXPIRES_MS),
    },
  });

  return token;
}

/**
 * Creates a new ACCESS + REFRESH token pair.
 *
 * Both token records are created atomically.
 */
async function issueTokens(userId: string, role: UserRole) {
  const accessTokenId = crypto.randomUUID();
  const refreshTokenId = crypto.randomUUID();

  const accessToken = createAccessToken(userId, role, accessTokenId);

  const refreshToken = createRefreshToken(userId, refreshTokenId);

  const now = Date.now();

  await prisma.$transaction([
    prisma.token.create({
      data: {
        id: accessTokenId,
        tokenHash: hashToken(accessToken),
        type: TokenType.ACCESS,
        userId,
        expiresAt: new Date(now + ACCESS_TOKEN_EXPIRES_MS),
      },
    }),

    prisma.token.create({
      data: {
        id: refreshTokenId,
        tokenHash: hashToken(refreshToken),
        type: TokenType.REFRESH,
        userId,
        expiresAt: new Date(now + REFRESH_TOKEN_EXPIRES_MS),
      },
    }),
  ]);

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: '1d',
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
    const setupToken = await createTwoFactorToken(user.id, user.role);

    return {
      user: getPublicUser(user),
      requiresTwoFactorSetup: true,
      setupToken,
    };
  }

  const tokens = await issueTokens(user.id, user.role);

  return {
    user: getPublicUser(user),
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
      const setupToken = await createTwoFactorToken(user.id, user.role);

      return {
        requiresTwoFactorSetup: true,
        setupToken,
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
    user: getPublicUser(user),
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
    user: getPublicUser(updatedUser),
  };
}

export async function refresh(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);

  const tokenRecord = await prisma.token.findUnique({
    where: {
      id: payload.tokenId,
    },
  });

  if (
    !tokenRecord ||
    tokenRecord.type !== TokenType.REFRESH ||
    tokenRecord.revokedAt ||
    tokenRecord.expiresAt <= new Date()
  ) {
    throw new Error('Refresh token is invalid or expired.');
  }

  if (tokenRecord.userId !== payload.userId) {
    throw new Error('Refresh token is invalid.');
  }

  if (tokenRecord.tokenHash !== hashToken(refreshToken)) {
    throw new Error('Refresh token is invalid.');
  }

  const user = await prisma.user.findUnique({
    where: {
      id: payload.userId,
    },
  });

  if (!user) {
    throw new Error('User no longer exists.');
  }

  const accessTokenId = crypto.randomUUID();

  const newRefreshTokenId = crypto.randomUUID();

  const newAccessToken = createAccessToken(user.id, user.role, accessTokenId);

  const newRefreshToken = createRefreshToken(user.id, newRefreshTokenId);

  const now = Date.now();

  await prisma.$transaction([
    prisma.token.update({
      where: {
        id: tokenRecord.id,
      },
      data: {
        revokedAt: new Date(),
      },
    }),

    prisma.token.create({
      data: {
        id: accessTokenId,
        tokenHash: hashToken(newAccessToken),
        type: TokenType.ACCESS,
        userId: user.id,
        expiresAt: new Date(now + ACCESS_TOKEN_EXPIRES_MS),
      },
    }),

    prisma.token.create({
      data: {
        id: newRefreshTokenId,
        tokenHash: hashToken(newRefreshToken),
        type: TokenType.REFRESH,
        userId: user.id,
        expiresAt: new Date(now + REFRESH_TOKEN_EXPIRES_MS),
      },
    }),
  ]);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    accessTokenExpiresIn: '1d',
    refreshTokenExpiresIn: '7d',
  };
}

export async function logout(refreshToken: string, accessToken?: string) {
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    try {
      const refreshPayload = verifyRefreshToken(refreshToken);

      const refreshRecord = await tx.token.findUnique({
        where: {
          id: refreshPayload.tokenId,
        },
      });

      if (
        refreshRecord &&
        refreshRecord.type === TokenType.REFRESH &&
        refreshRecord.userId === refreshPayload.userId &&
        refreshRecord.revokedAt === null &&
        refreshRecord.tokenHash === hashToken(refreshToken)
      ) {
        await tx.token.update({
          where: {
            id: refreshRecord.id,
          },
          data: {
            revokedAt: now,
          },
        });
      }
    } catch {
      // Logout remains idempotent.
    }

    if (accessToken) {
      try {
        const accessPayload = verifyAccessToken(accessToken);

        const accessRecord = await tx.token.findUnique({
          where: {
            id: accessPayload.tokenId,
          },
        });

        if (
          accessRecord &&
          accessRecord.type === TokenType.ACCESS &&
          accessRecord.userId === accessPayload.userId &&
          accessRecord.revokedAt === null &&
          accessRecord.tokenHash === hashToken(accessToken)
        ) {
          await tx.token.update({
            where: {
              id: accessRecord.id,
            },
            data: {
              revokedAt: now,
            },
          });
        }
      } catch {
        // Access token may already be expired.
        // Local frontend state will still be cleared.
      }
    }
  });
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
