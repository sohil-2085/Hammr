import type { NextFunction, Response } from 'express';

import type { AuthenticatedRequest } from './auth.middleware.js';

type Role = 'BUYER' | 'SELLER' | 'ADMIN';

export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission for this action.',
        },
      });
    }

    next();
  };
}
