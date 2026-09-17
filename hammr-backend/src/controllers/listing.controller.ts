import type { NextFunction, Request, Response } from 'express';

import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

import { createListing, getListings } from '../services/listing.service.js';

import { createListingSchema } from '../utils/validators/listing.validator.js';

export const createListingController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const result = createListingSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid listing data.',
        details: result.error.flatten().fieldErrors,
      },
    });
  }

  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        },
      });
    }

    const listing = await createListing(req.user.id, result.data);

    return res.status(201).json({
      data: listing,
    });
  } catch (error) {
    return next(error);
  }
};

export const getListingsController = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const listings = await getListings();

    return res.status(200).json({
      data: listings,
    });
  } catch (error) {
    return next(error);
  }
};
