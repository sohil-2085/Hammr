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
  return prisma.listing.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
};

/*
 * ==========================================
 * GET MY LISTINGS
 * ==========================================
 */

export const getMyListings = async (sellerId: string) => {
  return prisma.listing.findMany({
    where: {
      sellerId,
    },

    orderBy: {
      createdAt: 'desc',
    },
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

  /*
   * Current highest bid.
   */
  const currentHighestBid = listing.currentHighestBid ? listing.currentHighestBid.toFixed(2) : null;

  /*
   * Minimum next bid.
   *
   * First bid:
   * startingPrice
   *
   * Later:
   * currentHighestBid + minIncrement
   */
  const minimumNextBid = listing.currentHighestBid
    ? listing.currentHighestBid.plus(listing.minIncrement).toFixed(2)
    : listing.startingPrice.toFixed(2);

  /*
   * Reserve status.
   *
   * We expose only whether the reserve
   * has been met, never the reserve amount.
   */
  const reserveMet =
    listing.reservePrice !== null &&
    listing.currentHighestBid !== null &&
    listing.currentHighestBid.gte(listing.reservePrice);

  return {
    id: listing.id,

    title: listing.title,

    description: listing.description,

    images: listing.images,

    category: listing.category,

    startingPrice: listing.startingPrice.toFixed(2),

    currentHighestBid,

    currentHighestBidderId: listing.currentHighestBidderId,

    minIncrement: listing.minIncrement.toFixed(2),

    minimumNextBid,

    status: listing.status,

    scheduledStartAt: listing.scheduledStartAt.toISOString(),

    scheduledEndAt: listing.scheduledEndAt.toISOString(),

    currentEndAt: listing.currentEndAt.toISOString(),

    extensionCount: listing.extensionCount,

    reserveMet,

    seller: {
      id: listing.seller.id,

      name: listing.seller.name,
    },
  };
}
