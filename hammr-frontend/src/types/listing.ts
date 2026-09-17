export interface CreateListingInput {
  title: string;
  description: string;
  images: string[];
  category: string;
  startingPrice: string;
  reservePrice?: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
}