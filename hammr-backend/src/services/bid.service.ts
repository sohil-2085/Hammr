import { Prisma } from '@prisma/client';

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
     * Auction must currently be LIVE.
     */
    if (listing.status !== 'LIVE') {
      throw new Error('AUCTION_NOT_LIVE');
    }

    const now = new Date();

    /*
     * Never accept a bid after the effective end time.
     */
    if (now >= listing.currentEndAt) {
      throw new Error('AUCTION_ENDED');
    }

    /*
     * Seller cannot bid.
     */
    if (listing.sellerId === bidderId) {
      throw new Error('SELLER_CANNOT_BID');
    }

    /*
     * Save previous highest bidder BEFORE updating Listing.
     *
     * This is required for the private bid:outbid event.
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
     * Last 2 minutes:
     *   +2 minutes
     *
     * Maximum:
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
     * Update denormalized current-highest-bid state
     * in the SAME transaction.
     */
    const updatedListing = await tx.listing.update({
      where: {
        id: listingId,
      },
      data: {
        currentHighestBid: requestedAmount,
        currentHighestBidderId: bidderId,
        currentEndAt: newEndAt,
        extensionCount: newExtensionCount,
      },
    });

    /*
     * Reserve amount itself is NEVER returned to buyer.
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
