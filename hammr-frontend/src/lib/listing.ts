import { api } from '@/lib/api';

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

type ListingsResponse =
  | Listing[]
  | {
      listings: Listing[];
    };

export async function getListings(): Promise<Listing[]> {
  const response = await api.get<ListingsResponse>('/listings');

  if (Array.isArray(response)) {
    return response;
  }

  return response.listings;
}
