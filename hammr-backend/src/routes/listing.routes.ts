import { type NextFunction, type Request, type Response, Router } from 'express';

import {
  createListingController,
  getListingsController,
} from '../controllers/listing.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

const requireSeller = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as Request & { user?: { role?: string } }).user;

  if (user?.role !== 'SELLER') {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  next();
};

router.get('/listings', getListingsController);
router.post('/listings', authenticate, requireSeller, createListingController);

export default router;
