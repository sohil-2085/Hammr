import { ListingStatus } from '@prisma/client';

import { prisma } from '../prisma/client.js';

import type { CreateListingInput } from '../utils/validators/listing.validator.js';

/*
 * ==========================================
 * CREATE LISTING
 * ==========================================
 */

export const createListing = async (sellerId: string, input: CreateListingInput) => {
  const listing = await prisma.listing.create({
    data: {
      sellerId,

      title: input.title,

      description: input.description,

      images: input.images,

      category: input.category,

      startingPrice: input.startingPrice,

      ...(input.reservePrice !== undefined && {
        reservePrice: input.reservePrice,
      }),

      scheduledStartAt: input.scheduledStartAt,

      scheduledEndAt: input.scheduledEndAt,

      currentEndAt: input.scheduledEndAt,

      status: ListingStatus.SCHEDULED,
    },
  });

  return listing;
};

/*
 * ==========================================
 * GET ALL LISTINGS
 * ==========================================
 */

export const getListings = async () => {
  const listings = await prisma.listing.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  const now = new Date();

  return listings.map((listing) => {
    let effectiveStatus = listing.status;

    if (
      listing.status === 'SCHEDULED' &&
      now >= listing.scheduledStartAt &&
      now < listing.currentEndAt
    ) {
      effectiveStatus = 'LIVE';
    }

    if (listing.status !== 'CLOSED' && now >= listing.currentEndAt) {
      effectiveStatus = 'CLOSED';
    }

    return {
      ...listing,
      status: effectiveStatus,
    };
  });
};

/*
 * ==========================================
 * GET MY LISTINGS
 * ==========================================
 */

export const getMyListings = async (sellerId: string) => {
  const listings = await prisma.listing.findMany({
    where: {
      sellerId,
    },

    orderBy: {
      createdAt: 'desc',
    },
  });

  const now = new Date();

  return listings.map((listing) => {
    let effectiveStatus = listing.status;

    if (
      listing.status === 'SCHEDULED' &&
      now >= listing.scheduledStartAt &&
      now < listing.currentEndAt
    ) {
      effectiveStatus = 'LIVE';
    }

    if (listing.status !== 'CLOSED' && now >= listing.currentEndAt) {
      effectiveStatus = 'CLOSED';
    }

    return {
      ...listing,
      status: effectiveStatus,
    };
  });
};

/*
 * ==========================================
 * GET LISTING DETAIL
 * ==========================================
 *
 * Used by:
 *
 * GET /listings/:id
 *
 * The exact reserve price is NEVER
 * returned to the buyer.
 */

export async function getListingDetail(listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: {
      id: listingId,
    },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!listing) {
    throw new Error('LISTING_NOT_FOUND');
  }

  const now = new Date();

  let effectiveStatus = listing.status;

  /*
   * If the auction has reached its scheduled start
   * and has not reached its current end time,
   * treat it as LIVE.
   */
  if (
    listing.status === 'SCHEDULED' &&
    now >= listing.scheduledStartAt &&
    now < listing.currentEndAt
  ) {
    effectiveStatus = 'LIVE';
  }

  /*
   * If the current end time has passed,
   * treat it as CLOSED.
   */
  if (listing.status !== 'CLOSED' && now >= listing.currentEndAt) {
    effectiveStatus = 'CLOSED';
  }

  const currentHighestBid = listing.currentHighestBid ? Number(listing.currentHighestBid) : null;

  const startingPrice = Number(listing.startingPrice);
  const minIncrement = Number(listing.minIncrement);

  const minimumNextBid =
    currentHighestBid !== null ? currentHighestBid + minIncrement : startingPrice;

  const reserveMet =
    listing.reservePrice !== null && currentHighestBid !== null
      ? currentHighestBid >= Number(listing.reservePrice)
      : false;

  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    images: listing.images,
    category: listing.category,

    startingPrice: listing.startingPrice.toString(),

    currentHighestBid: listing.currentHighestBid?.toString() ?? null,

    currentHighestBidderId: listing.currentHighestBidderId,

    minIncrement: listing.minIncrement.toString(),

    minimumNextBid: minimumNextBid.toFixed(2),

    status: effectiveStatus,

    scheduledStartAt: listing.scheduledStartAt,

    scheduledEndAt: listing.scheduledEndAt,

    currentEndAt: listing.currentEndAt,

    extensionCount: listing.extensionCount,

    reserveMet,

    seller: listing.seller,
  };
}
