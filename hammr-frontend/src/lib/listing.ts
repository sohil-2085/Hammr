import { getListings as getListingsRequest } from './api';

export type Listing = {
  id: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  startingPrice: number | string;
  currentHighestBid: number | string | null;
  scheduledStartAt: string;
  currentEndAt: string;
  status: 'SCHEDULED' | 'LIVE' | 'CLOSED';
};

export async function getListings(): Promise<Listing[]> {
  return getListingsRequest<Listing[]>();
}