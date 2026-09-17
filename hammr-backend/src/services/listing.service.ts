import { ListingStatus } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import type { CreateListingInput } from '../utils/validators/listing.validator.js';

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

export const getListings = async () => {
  return prisma.listing.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
};

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
