import { getListings as getListingsRequest, getMyListings as getMyListingsRequest } from './api';

export type Listing = {
  id: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  startingPrice: number | string;
  reservePrice?: number | string | null;
  currentHighestBid: number | string | null;
  scheduledStartAt: string;
  scheduledEndAt?: string;
  currentEndAt: string;
  status: 'SCHEDULED' | 'LIVE' | 'CLOSED';
};

export async function getListings(): Promise<Listing[]> {
  return getListingsRequest<Listing[]>();
}

export async function getMyListings(): Promise<Listing[]> {
  return getMyListingsRequest<Listing[]>();
}
