'use client';

import type { BidHistoryItem } from '@/types/auction';

interface BidHistoryProps {
  bids: BidHistoryItem[];
}

function formatDate(
  date: string,
) {
  return new Date(
    date,
  ).toLocaleString();
}

export default function BidHistory({
  bids,
}: BidHistoryProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900">
          Bid History
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          All bids are permanently recorded.
        </p>
      </div>

      {bids.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-gray-500">
            No bids yet.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {bids.map(
            (bid, index) => (
              <div
                key={bid.id}
                className="flex items-center justify-between gap-4 p-5"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                    {index + 1}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {bid.bidderName}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {formatDate(
                        bid.createdAt,
                      )}
                    </p>
                  </div>
                </div>

                <p className="shrink-0 text-lg font-bold text-gray-900">
                  ${bid.amount}
                </p>
              </div>
            ),
          )}
        </div>
      )}
    </section>
  );
}