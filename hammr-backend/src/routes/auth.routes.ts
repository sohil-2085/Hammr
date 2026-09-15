import { Router } from 'express';

import {
  login,
  logout,
  refresh,
  register,
  setupTwoFactor,
  verifyTwoFactor,
} from '../controllers/auth.controller.js';

import { authenticate, authenticateTwoFactorSetup } from '../middlewares/auth.middleware.js';

import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.post('/register', register);

router.post('/login', login);

router.post('/2fa/setup', authenticateTwoFactorSetup, requireRole('SELLER'), setupTwoFactor);

router.post('/2fa/verify', authenticateTwoFactorSetup, requireRole('SELLER'), verifyTwoFactor);

router.post('/refresh', refresh);

router.post('/logout', logout);

export default router;
