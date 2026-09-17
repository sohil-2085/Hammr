import type {
  AuctionDetail,
  BidHistoryItem,
} from '@/types/auction';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000';

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(
    options.headers,
  );

  headers.set(
    'Content-Type',
    'application/json',
  );

  /*
   * Use the same sessionStorage token
   * used by your existing api.ts.
   */
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem(
      'hammr_access_token',
    );

    if (
      token &&
      !headers.has('Authorization')
    ) {
      headers.set(
        'Authorization',
        `Bearer ${token}`,
      );
    }
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers,
      cache: 'no-store',
    },
  );

  const body = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      body?.error?.message ??
        'Something went wrong.',
    );
  }

  /*
   * Supports both:
   *
   * { data: ... }
   *
   * and
   *
   * { ... }
   *
   * so the Auction Detail isn't tightly
   * coupled to one response wrapper.
   */
  return (
    body?.data ??
    body
  ) as T;
}

export async function getAuctionDetail(
  listingId: string,
) {
  return request<AuctionDetail>(
    `/listings/${listingId}`,
  );
}

export async function getAuctionBidHistory(
  listingId: string,
) {
  const result =
    await request<
      | BidHistoryItem[]
      | {
          bids: BidHistoryItem[];
        }
    >(
      `/listings/${listingId}/bids`,
    );

  if (Array.isArray(result)) {
    return result;
  }

  return result.bids ?? [];
}

export interface PlaceBidResponse {
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

  wasExtended: boolean;
}

export async function placeBid(
  listingId: string,
  amount: string,
) {
  return request<PlaceBidResponse>(
    `/listings/${listingId}/bids`,
    {
      method: 'POST',
      body: JSON.stringify({
        amount,
      }),
    },
  );
}