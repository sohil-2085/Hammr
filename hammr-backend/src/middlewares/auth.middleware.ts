import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken, verifyTwoFactorSetupToken } from '../utils/jwt.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'BUYER' | 'SELLER' | 'ADMIN';
  };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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

    const token = header.substring(7);

    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.userId,
      role: payload.role,
    };

    next();
  } catch {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired access token.',
      },
    });
  }
}

export function authenticateTwoFactorSetup(
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

    const token = header.substring(7);

    const payload = verifyTwoFactorSetupToken(token);

    if (payload.role !== 'SELLER') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Seller access required.',
        },
      });
    }

    req.user = {
      id: payload.userId,
      role: payload.role,
    };

    next();
  } catch {
    return res.status(401).json({
      error: {
        code: 'INVALID_SETUP_TOKEN',
        message: 'Invalid or expired 2FA setup token.',
      },
    });
  }
}
