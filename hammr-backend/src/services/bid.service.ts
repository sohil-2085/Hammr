import { ListingStatus, Prisma } from '@prisma/client';

import { prisma } from '../prisma/client.js';

import type { PlaceBidInput } from '../utils/bid.validation.js';

const MAX_EXTENSIONS = 10;
const EXTENSION_TRIGGER_MS = 2 * 60 * 1000;
const EXTENSION_DURATION_MS = 2 * 60 * 1000;

export async function placeBid(listingId: string, bidderId: string, input: PlaceBidInput) {
  const requestedAmount = new Prisma.Decimal(input.amount);

  return prisma.$transaction(async (tx) => {
    /*
     * Lock the listing row.
     *
     * This prevents two buyers from reading the same
     * highest bid and both becoming the highest bidder.
     */
    const lockedListings = await tx.$queryRaw<
      Array<{
        id: string;
        sellerId: string;
        title: string;

        currentHighestBid: Prisma.Decimal | null;
        currentHighestBidderId: string | null;

        startingPrice: Prisma.Decimal;
        reservePrice: Prisma.Decimal | null;
        minIncrement: Prisma.Decimal;

        scheduledStartAt: Date;
        scheduledEndAt: Date;
        currentEndAt: Date;

        extensionCount: number;
        status: string;
      }>
    >`
      SELECT
        id,
        "sellerId",
        title,
        "currentHighestBid",
        "currentHighestBidderId",
        "startingPrice",
        "reservePrice",
        "minIncrement",
        "scheduledStartAt",
        "scheduledEndAt",
        "currentEndAt",
        "extensionCount",
        status
      FROM "Listing"
      WHERE id = ${listingId}::uuid
      FOR UPDATE
    `;

    const listing = lockedListings[0];

    if (!listing) {
      throw new Error('LISTING_NOT_FOUND');
    }

    /*
     * Always use the backend/server time for
     * auction validation.
     */
    const now = new Date();

    /*
     * Check whether the auction has actually started.
     */
    const auctionHasStarted = now >= listing.scheduledStartAt;

    /*
     * Check the effective end time.
     *
     * currentEndAt can be extended by the
     * anti-sniping rule.
     */
    const auctionHasEnded = now >= listing.currentEndAt;

    /*
     * CLOSED is final.
     *
     * Never allow a bid into an already closed
     * auction, even if the timestamps happen
     * to be inconsistent.
     */
    if (listing.status === ListingStatus.CLOSED) {
      throw new Error('AUCTION_CLOSED');
    }

    /*
     * Never accept a bid after the effective
     * end time.
     */
    if (auctionHasEnded) {
      throw new Error('AUCTION_ENDED');
    }

    /*
     * Auction has not started yet.
     */
    if (!auctionHasStarted) {
      throw new Error('AUCTION_NOT_LIVE');
    }

    /*
     * If the auction has reached its scheduled
     * start time but the database status is still
     * SCHEDULED, transition it to LIVE.
     *
     * IMPORTANT:
     *
     * The listing row was already locked using
     * SELECT ... FOR UPDATE.
     *
     * Therefore another simultaneous bid cannot
     * modify this listing between the validation
     * and this status update.
     */
    if (listing.status === ListingStatus.SCHEDULED) {
      await tx.listing.update({
        where: {
          id: listing.id,
        },
        data: {
          status: ListingStatus.LIVE,
        },
      });
    }

    /*
     * Seller cannot bid on their own listing.
     */
    if (listing.sellerId === bidderId) {
      throw new Error('SELLER_CANNOT_BID');
    }

    /*
     * Save previous highest bidder BEFORE
     * updating Listing.
     *
     * This is required for the private
     * bid:outbid event.
     */
    const previousHighestBidderId = listing.currentHighestBidderId;

    const previousHighestBid = listing.currentHighestBid;

    /*
     * Minimum valid bid.
     *
     * First bid:
     *   startingPrice
     *
     * Later bids:
     *   currentHighestBid + minIncrement
     */
    const minimumBid = listing.currentHighestBid
      ? listing.currentHighestBid.plus(listing.minIncrement)
      : listing.startingPrice;

    if (requestedAmount.lt(minimumBid)) {
      throw new Error(`BID_TOO_LOW:${minimumBid.toFixed(2)}`);
    }

    /*
     * Create immutable bid record.
     */
    const bid = await tx.bid.create({
      data: {
        listingId,
        bidderId,
        amount: requestedAmount,
      },

      include: {
        bidder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    /*
     * Anti-sniping.
     *
     * If a bid arrives within the last 2 minutes:
     *
     *   +2 minutes
     *
     * Maximum:
     *
     *   10 extensions
     */
    let newEndAt = listing.currentEndAt;

    let newExtensionCount = listing.extensionCount;

    let wasExtended = false;

    const timeUntilEnd = listing.currentEndAt.getTime() - now.getTime();

    if (timeUntilEnd <= EXTENSION_TRIGGER_MS && listing.extensionCount < MAX_EXTENSIONS) {
      newEndAt = new Date(listing.currentEndAt.getTime() + EXTENSION_DURATION_MS);

      newExtensionCount = listing.extensionCount + 1;

      wasExtended = true;
    }

    /*
     * Update denormalized current-highest-bid
     * state in the SAME transaction.
     *
     * Also persist LIVE status if this bid
     * caused the SCHEDULED -> LIVE transition.
     */
    const updatedListing = await tx.listing.update({
      where: {
        id: listingId,
      },

      data: {
        status: ListingStatus.LIVE,

        currentHighestBid: requestedAmount,

        currentHighestBidderId: bidderId,

        currentEndAt: newEndAt,

        extensionCount: newExtensionCount,
      },
    });

    /*
     * Reserve amount itself is NEVER returned
     * to the buyer.
     */
    const reserveMet = listing.reservePrice !== null && requestedAmount.gte(listing.reservePrice);

    /*
     * Minimum amount required for the NEXT bid.
     */
    const minimumNextBid = requestedAmount.plus(listing.minIncrement).toFixed(2);

    return {
      bid: {
        id: bid.id,
        listingId: bid.listingId,
        bidderId: bid.bidderId,
        bidderName: bid.bidder.name,
        amount: bid.amount.toFixed(2),
        createdAt: bid.createdAt.toISOString(),
      },

      currentHighestBid: updatedListing.currentHighestBid!.toFixed(2),

      currentHighestBidderId: updatedListing.currentHighestBidderId,

      previousHighestBidderId,

      previousHighestBid: previousHighestBid ? previousHighestBid.toFixed(2) : null,

      minimumNextBid,

      currentEndAt: updatedListing.currentEndAt.toISOString(),

      extensionCount: updatedListing.extensionCount,

      reserveMet,

      wasExtended,
    };
  });
}

export async function getBidHistory(listingId: string) {
  const bids = await prisma.bid.findMany({
    where: {
      listingId,
    },

    orderBy: [
      {
        amount: 'desc',
      },
      {
        createdAt: 'asc',
      },
    ],

    include: {
      bidder: {
        select: {
          name: true,
        },
      },
    },
  });

  return bids.map((bid) => ({
    id: bid.id,

    bidderName: bid.bidder.name,

    amount: bid.amount.toFixed(2),

    createdAt: bid.createdAt.toISOString(),
  }));
}
