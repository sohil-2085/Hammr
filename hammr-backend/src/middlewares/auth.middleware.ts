import type { NextFunction, Request, Response } from 'express';

import { TokenType } from '@prisma/client';

import { verifyAccessToken, verifyTwoFactorSetupToken, hashToken } from '../utils/jwt.js';

import { prisma } from '../prisma/client.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'BUYER' | 'SELLER' | 'ADMIN';
  };
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        },
      });
    }

    const token = header.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        },
      });
    }

    const payload = verifyAccessToken(token);

    const tokenRecord = await prisma.token.findUnique({
      where: {
        id: payload.tokenId,
      },
    });

    if (
      !tokenRecord ||
      tokenRecord.type !== TokenType.ACCESS ||
      tokenRecord.userId !== payload.userId ||
      tokenRecord.revokedAt ||
      tokenRecord.expiresAt <= new Date()
    ) {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired access token.',
        },
      });
    }

    if (tokenRecord.tokenHash !== hashToken(token)) {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid access token.',
        },
      });
    }

    req.user = {
      id: payload.userId,
      role: payload.role,
    };

    return next();
  } catch {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired access token.',
      },
    });
  }
}

export async function authenticateTwoFactorSetup(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        },
      });
    }

    const token = header.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        },
      });
    }

    const payload = verifyTwoFactorSetupToken(token);

    if (payload.role !== 'SELLER') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Seller access required.',
        },
      });
    }

    const tokenRecord = await prisma.token.findUnique({
      where: {
        id: payload.tokenId,
      },
    });

    if (
      !tokenRecord ||
      tokenRecord.type !== TokenType.TWO_FACTOR ||
      tokenRecord.userId !== payload.userId ||
      tokenRecord.revokedAt ||
      tokenRecord.expiresAt <= new Date()
    ) {
      return res.status(401).json({
        error: {
          code: 'INVALID_SETUP_TOKEN',
          message: 'Invalid or expired 2FA setup token.',
        },
      });
    }

    if (tokenRecord.tokenHash !== hashToken(token)) {
      return res.status(401).json({
        error: {
          code: 'INVALID_SETUP_TOKEN',
          message: 'Invalid 2FA setup token.',
        },
      });
    }

    req.user = {
      id: payload.userId,
      role: payload.role,
    };

    return next();
  } catch {
    return res.status(401).json({
      error: {
        code: 'INVALID_SETUP_TOKEN',
        message: 'Invalid or expired 2FA setup token.',
      },
    });
  }
}
