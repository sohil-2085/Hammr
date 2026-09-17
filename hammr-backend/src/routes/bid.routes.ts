import { Router } from 'express';

import { getBidHistoryController, placeBidController } from '../controllers/bid.controller.js';

import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

/*
 * Public
 * GET /listings/:id/bids
 */
router.get('/listings/:id/bids', getBidHistoryController);

/*
 * Buyer only
 * POST /listings/:id/bids
 */
router.post('/listings/:id/bids', authenticate, requireRole('BUYER'), placeBidController);

export default router;
