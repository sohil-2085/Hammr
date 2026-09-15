import type { Request, Response } from 'express';
import { z } from 'zod';

import * as authService from '../services/auth.service.js';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(['BUYER', 'SELLER']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twoFactorCode: z
    .string()
    .regex(/^\d{6}$/)
    .optional(),
});

const twoFactorVerifySchema = z.object({
  code: z.string().regex(/^\d{6}$/),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function register(
  req: Request,
  res: Response,
) {
  try {
    const input = registerSchema.parse(req.body);

    const result = await authService.register(
      input.name,
      input.email,
      input.password,
      input.role,
    );

    return res.status(201).json({
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid registration data.',
          details: error.flatten(),
        },
      });
    }

    const message =
      error instanceof Error
        ? error.message
        : 'Registration failed.';

    const status =
      message.includes('already exists')
        ? 409
        : 400;

    return res.status(status).json({
      error: {
        code:
          status === 409
            ? 'EMAIL_EXISTS'
            : 'REGISTRATION_FAILED',
        message,
      },
    });
  }
}

export async function login(
  req: Request,
  res: Response,
) {
  try {
    const input = loginSchema.parse(req.body);

    const result = await authService.login(
      input.email,
      input.password,
      input.twoFactorCode,
    );

    return res.status(200).json({
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid login data.',
          details: error.flatten(),
        },
      });
    }

    return res.status(401).json({
      error: {
        code: 'LOGIN_FAILED',
        message:
          error instanceof Error
            ? error.message
            : 'Login failed.',
      },
    });
  }
}

export async function setupTwoFactor(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        },
      });
    }

    const result =
      await authService.setupTwoFactor(
        req.user.id,
      );

    return res.status(200).json({
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      error: {
        code: 'TWO_FACTOR_SETUP_FAILED',
        message:
          error instanceof Error
            ? error.message
            : '2FA setup failed.',
      },
    });
  }
}

export async function verifyTwoFactor(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        },
      });
    }

    const input =
      twoFactorVerifySchema.parse(req.body);

    const result =
      await authService.verifyTwoFactor(
        req.user.id,
        input.code,
      );

    const tokens =
      await authService.loginAfterTwoFactor(
        req.user.id,
      );

    return res.status(200).json({
      data: {
        ...result,
        ...(typeof tokens === 'object' && tokens !== null
          ? tokens
          : {}),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'A valid 6-digit 2FA code is required.',
        },
      });
    }

    return res.status(400).json({
      error: {
        code: 'TWO_FACTOR_VERIFICATION_FAILED',
        message:
          error instanceof Error
            ? error.message
            : '2FA verification failed.',
      },
    });
  }
}

export async function refresh(
  req: Request,
  res: Response,
) {
  try {
    const input = refreshSchema.parse(req.body);

    const tokens =
      await authService.refresh(
        input.refreshToken,
      );

    return res.status(200).json({
      data: tokens,
    });
  } catch {
    return res.status(401).json({
      error: {
        code: 'INVALID_REFRESH_TOKEN',
        message:
          'Refresh token is invalid or expired.',
      },
    });
  }
}

export async function logout(
  req: Request,
  res: Response,
) {
  try {
    const input = refreshSchema.parse(req.body);

    await authService.logout(
      input.refreshToken,
    );

    return res.status(204).send();
  } catch {
    return res.status(204).send();
  }
}