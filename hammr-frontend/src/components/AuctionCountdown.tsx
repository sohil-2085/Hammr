'use client';

import { useAuctionCountdown } from '@/hooks/useAuctionCountdown';

interface AuctionCountdownProps {
  status:
    | 'SCHEDULED'
    | 'LIVE'
    | 'CLOSED';

  scheduledStartAt: string;
  currentEndAt: string;
}

export default function AuctionCountdown({
  status,
  scheduledStartAt,
  currentEndAt,
}: AuctionCountdownProps) {
  const {
    phase,
    days,
    hours,
    minutes,
    seconds,
  } = useAuctionCountdown({
    status,
    scheduledStartAt,
    currentEndAt,
  });

  if (phase === 'CLOSED') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-100 p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Auction
        </p>

        <p className="mt-2 text-2xl font-bold text-gray-900">
          Auction Closed
        </p>
      </div>
    );
  }

  const label =
    phase === 'SCHEDULED'
      ? 'Auction starts in'
      : 'Auction ends in';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </p>

        {phase === 'LIVE' && (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
            LIVE
          </span>
        )}

        {phase === 'SCHEDULED' && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
            UPCOMING
          </span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-4 gap-3">
        {[
          ['Days', days],
          ['Hours', hours],
          ['Minutes', minutes],
          ['Seconds', seconds],
        ].map(([labelText, value]) => (
          <div
            key={labelText}
            className="rounded-xl bg-gray-50 p-3 text-center"
          >
            <p className="text-2xl font-black text-gray-900 sm:text-3xl">
              {String(value).padStart(
                2,
                '0',
              )}
            </p>

            <p className="mt-1 text-xs font-medium text-gray-500">
              {labelText}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}