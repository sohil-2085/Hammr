export type AuctionStatus =
  | 'SCHEDULED'
  | 'LIVE'
  | 'CLOSED';

export interface AuctionDetail {
  id: string;
  title: string;
  description: string;
  images: string[];
  category: string;

  startingPrice: number | string;

  currentHighestBid:
    | number
    | string
    | null;

  currentHighestBidderId:
    | string
    | null;

  minIncrement:
    | number
    | string;

  scheduledStartAt: string;
  scheduledEndAt: string;
  currentEndAt: string;

  extensionCount: number;

  status: AuctionStatus;

  sellerId?: string;
  sellerName?: string;

  winner?: {
    id: string;
    name: string;
  } | null;
}

export interface BidHistoryItem {
  id: string;
  bidderName: string;
  amount: string;
  createdAt: string;
}

export interface BidNewEvent {
  bid: {
    id: string;
    listingId: string;
    bidderId: string;
    bidderName: string;
    amount: string;
    createdAt: string;
  };

  currentHighestBid: string;

  currentHighestBidderId:
    | string
    | null;

  minimumNextBid: string;

  currentEndAt: string;

  extensionCount: number;

  reserveMet: boolean;
}

export interface AuctionExtendedEvent {
  listingId: string;
  currentEndAt: string;
  extensionCount: number;
}

export interface AuctionStartedEvent {
  listingId: string;
}

export interface AuctionClosedEvent {
  listingId: string;
}

export interface BidOutbidEvent {
  listingId: string;

  previousBid:
    | string
    | null;

  newHighestBid: string;

  newHighestBidderId: string;

  minimumNextBid: string;
}