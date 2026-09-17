import type { Request, Response } from 'express';
import type { Server } from 'socket.io';

import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

import {
  getBidHistory,
  placeBid,
} from '../services/bid.service.js';

import type { PlaceBidInput } from '../utils/bid.validation.js';

/*
 * GET /listings/:id/bids
 *
 * Public endpoint.
 */
export async function getBidHistoryController(
  req: Request,
  res: Response,
) {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        error: {
          code: 'INVALID_LISTING_ID',
          message: 'A valid listing ID is required',
        },
      });
    }

    const bids = await getBidHistory(id);

    return res.status(200).json({
      bids,
    });
  } catch (error) {
    console.error(
      'Get bid history error:',
      error,
    );

    return res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get bid history',
      },
    });
  }
}

/*
 * POST /listings/:id/bids
 *
 * Buyer only.
 */
export async function placeBidController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const { id } = req.params;

    /*
     * authenticate middleware should already
     * have attached req.user.
     */
    if (!req.user?.id) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        error: {
          code: 'INVALID_LISTING_ID',
          message: 'A valid listing ID is required',
        },
      });
    }

    /*
     * Basic runtime validation.
     *
     * The route already guarantees BUYER role.
     */
    const body = req.body as Partial<PlaceBidInput>;

    if (
      body.amount === undefined ||
      body.amount === null ||
      String(body.amount).trim() === ''
    ) {
      return res.status(400).json({
        error: {
          code: 'INVALID_BID_AMOUNT',
          message: 'Bid amount is required',
        },
      });
    }

    const amount = String(body.amount).trim();

    /*
     * Accept normal decimal monetary values.
     */
    if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_BID_AMOUNT',
          message:
            'Bid amount must be a valid monetary amount',
        },
      });
    }

    const input: PlaceBidInput = {
      amount,
    };

    const result = await placeBid(
      id,
      req.user.id,
      input,
    );

    /*
     * Socket.IO instance was attached in index.ts:
     *
     * app.set('io', io)
     */
    const io = req.app.get('io') as Server | undefined;

    if (io) {
      /*
       * Broadcast new bid to everyone watching
       * this auction.
       */
      io.to(`auction:${id}`).emit(
        'bid:new',
        {
          bid: result.bid,

          currentHighestBid:
            result.currentHighestBid,

          currentHighestBidderId:
            result.currentHighestBidderId,

          minimumNextBid:
            result.minimumNextBid,

          currentEndAt:
            result.currentEndAt,

          extensionCount:
            result.extensionCount,

          reserveMet:
            result.reserveMet,
        },
      );

      /*
       * Tell the previous highest bidder
       * that they have been outbid.
       *
       * IMPORTANT:
       * This MUST use previousHighestBidderId,
       * NOT currentHighestBidderId.
       */
      if (
        result.previousHighestBidderId &&
        result.previousHighestBidderId !==
          req.user.id
      ) {
        io.to(
          `user:${result.previousHighestBidderId}`,
        ).emit('bid:outbid', {
          listingId: id,

          previousBid:
            result.previousHighestBid,

          newHighestBid:
            result.currentHighestBid,

          newHighestBidderId:
            result.currentHighestBidderId,

          minimumNextBid:
            result.minimumNextBid,
        });
      }

      /*
       * Tell everyone watching that the auction
       * closing time moved.
       */
      if (result.wasExtended) {
        io.to(`auction:${id}`).emit(
          'auction:extended',
          {
            listingId: id,
            currentEndAt:
              result.currentEndAt,
            extensionCount:
              result.extensionCount,
          },
        );
      }
    }

    return res.status(201).json({
      bid: result.bid,

      currentHighestBid:
        result.currentHighestBid,

      currentHighestBidderId:
        result.currentHighestBidderId,

      minimumNextBid:
        result.minimumNextBid,

      currentEndAt:
        result.currentEndAt,

      extensionCount:
        result.extensionCount,

      reserveMet:
        result.reserveMet,

      wasExtended:
        result.wasExtended,
    });
  } catch (error) {
    console.error(
      'Place bid error:',
      error,
    );

    if (error instanceof Error) {
      const message = error.message;

      if (message === 'LISTING_NOT_FOUND') {
        return res.status(404).json({
          error: {
            code: 'LISTING_NOT_FOUND',
            message: 'Listing not found',
          },
        });
      }

      if (message === 'AUCTION_NOT_LIVE') {
        return res.status(400).json({
          error: {
            code: 'AUCTION_NOT_LIVE',
            message:
              'This auction is not currently live',
          },
        });
      }

      if (message === 'AUCTION_ENDED') {
        return res.status(400).json({
          error: {
            code: 'AUCTION_ENDED',
            message: 'This auction has ended',
          },
        });
      }

      if (message === 'SELLER_CANNOT_BID') {
        return res.status(403).json({
          error: {
            code: 'SELLER_CANNOT_BID',
            message:
              'You cannot bid on your own listing',
          },
        });
      }

      if (message.startsWith('BID_TOO_LOW:')) {
        const minimumBid =
          message.split(':')[1];

        return res.status(400).json({
          error: {
            code: 'BID_TOO_LOW',
            message:
              `Bid must be at least $${minimumBid}`,
          },
        });
      }
    }

    return res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to place bid',
      },
    });
  }
}