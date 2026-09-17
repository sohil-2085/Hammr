'use client';

import { useEffect, useMemo, useState } from 'react';

type CountdownPhase =
  | 'SCHEDULED'
  | 'LIVE'
  | 'CLOSED';

interface UseAuctionCountdownOptions {
  status:
    | 'SCHEDULED'
    | 'LIVE'
    | 'CLOSED';

  scheduledStartAt: string;
  currentEndAt: string;
}

function getRemainingMilliseconds(
  target: string,
) {
  return Math.max(
    0,
    new Date(target).getTime() -
      Date.now(),
  );
}

export function useAuctionCountdown({
  status,
  scheduledStartAt,
  currentEndAt,
}: UseAuctionCountdownOptions) {
  const [now, setNow] = useState(
    () => Date.now(),
  );

  useEffect(() => {
    const interval = window.setInterval(
      () => {
        setNow(Date.now());
      },
      1000,
    );

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const phase =
    useMemo<CountdownPhase>(() => {
      if (status === 'CLOSED') {
        return 'CLOSED';
      }

      if (
        status === 'SCHEDULED' &&
        now <
          new Date(
            scheduledStartAt,
          ).getTime()
      ) {
        return 'SCHEDULED';
      }

      if (
        status === 'LIVE' &&
        now <
          new Date(
            currentEndAt,
          ).getTime()
      ) {
        return 'LIVE';
      }

      /*
       * If local time reaches the scheduled start,
       * display LIVE even before the scheduler event
       * arrives.
       */
      if (
        status === 'SCHEDULED' &&
        now >=
          new Date(
            scheduledStartAt,
          ).getTime()
      ) {
        return 'LIVE';
      }

      return 'CLOSED';
    }, [
      status,
      scheduledStartAt,
      currentEndAt,
      now,
    ]);

  const target =
    phase === 'SCHEDULED'
      ? scheduledStartAt
      : currentEndAt;

  const remaining =
    getRemainingMilliseconds(target);

  const totalSeconds =
    Math.floor(remaining / 1000);

  const days =
    Math.floor(
      totalSeconds /
        (24 * 60 * 60),
    );

  const hours =
    Math.floor(
      (totalSeconds %
        (24 * 60 * 60)) /
        (60 * 60),
    );

  const minutes =
    Math.floor(
      (totalSeconds %
        (60 * 60)) /
        60,
    );

  const seconds =
    totalSeconds % 60;

  return {
    phase,
    remaining,
    days,
    hours,
    minutes,
    seconds,
    isExpired: remaining <= 0,
  };
}