import type { NextFunction, Request, Response } from 'express';

import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

import {
  createListing,
  getListingDetail,
  getListings,
  getMyListings,
} from '../services/listing.service.js';

import { createListingSchema } from '../utils/validators/listing.validator.js';

/*
 * ==========================================
 * CREATE LISTING
 * ==========================================
 */

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

/*
 * ==========================================
 * GET ALL LISTINGS
 * ==========================================
 *
 * GET /listings
 */

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

/*
 * ==========================================
 * GET MY LISTINGS
 * ==========================================
 *
 * GET /listings/mine
 */

export const getMyListingsController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        },
      });
    }

    const listings = await getMyListings(req.user.id);

    return res.status(200).json({
      data: listings,
    });
  } catch (error) {
    return next(error);
  }
};

/*
 * ==========================================
 * GET LISTING DETAIL
 * ==========================================
 *
 * GET /listings/:id
 *
 * Public.
 */

export async function getListingDetailController(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (typeof id !== 'string' || !id.trim()) {
      return res.status(400).json({
        error: {
          code: 'INVALID_LISTING_ID',
          message: 'Listing ID is required.',
        },
      });
    }

    const listing = await getListingDetail(id);

    return res.status(200).json({
      data: listing,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'LISTING_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'LISTING_NOT_FOUND',
          message: 'Listing not found.',
        },
      });
    }

    console.error('Get listing detail error:', error);

    return res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch listing.',
      },
    });
  }
}
