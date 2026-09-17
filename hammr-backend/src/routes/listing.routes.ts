import { type NextFunction, type Request, type Response, Router } from 'express';

import {
  createListingController,
  getListingDetailController,
  getListingsController,
  getMyListingsController,
} from '../controllers/listing.controller.js';

import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

/*
 * Seller-only middleware.
 */
const requireSeller = (req: Request, res: Response, next: NextFunction) => {
  const user = (
    req as Request & {
      user?: {
        role?: string;
      };
    }
  ).user;

  if (user?.role !== 'SELLER') {
    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Seller access required.',
      },
    });

    return;
  }

  next();
};

/*
 * ==========================================
 * LISTINGS
 * ==========================================
 */

/*
 * GET /listings
 *
 * Public - browse auctions.
 */
router.get('/listings', getListingsController);

/*
 * GET /listings/mine
 *
 * Seller only - seller's own listings.
 */
router.get('/listings/mine', authenticate, requireSeller, getMyListingsController);

/*
 * GET /listings/:id
 *
 * Public - Auction Detail page.
 *
 * IMPORTANT:
 * This was previously:
 *
 * router.get('/:id', ...)
 *
 * which caused the 404 for /listings/:id.
 */
router.get('/listings/:id', getListingDetailController);

/*
 * POST /listings
 *
 * Seller only - create listing.
 */
router.post('/listings', authenticate, requireSeller, createListingController);

export default router;
