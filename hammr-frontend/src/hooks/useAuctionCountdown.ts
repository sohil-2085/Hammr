'use client';

import { useEffect, useMemo, useState } from 'react';

type CountdownPhase = 'SCHEDULED' | 'LIVE' | 'CLOSED';

interface UseAuctionCountdownOptions {
  status: 'SCHEDULED' | 'LIVE' | 'CLOSED';

  scheduledStartAt: string;
  currentEndAt: string;
}

function getRemainingMilliseconds(target: string) {
  const targetTime = new Date(target).getTime();

  if (!Number.isFinite(targetTime)) {
    return 0;
  }

  return Math.max(0, targetTime - Date.now());
}

export function useAuctionCountdown({
  status,
  scheduledStartAt,
  currentEndAt,
}: UseAuctionCountdownOptions) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const startTime = useMemo(() => new Date(scheduledStartAt).getTime(), [scheduledStartAt]);

  const endTime = useMemo(() => new Date(currentEndAt).getTime(), [currentEndAt]);

  const phase = useMemo<CountdownPhase>(() => {
    /*
     * Invalid dates should not be
     * treated as a live auction.
     */
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
      return 'CLOSED';
    }

    /*
     * Effective end time always wins.
     *
     * This prevents:
     *
     * LIVE
     * 00:00:00
     *
     * when the auction has actually ended.
     */
    if (now >= endTime) {
      return 'CLOSED';
    }

    /*
     * Before scheduled start.
     */
    if (now < startTime) {
      return 'SCHEDULED';
    }

    /*
     * Between start and current end.
     */
    return 'LIVE';
  }, [startTime, endTime, now]);

  const target = phase === 'SCHEDULED' ? scheduledStartAt : currentEndAt;

  const remaining = getRemainingMilliseconds(target);

  const totalSeconds = Math.floor(remaining / 1000);

  const days = Math.floor(totalSeconds / (24 * 60 * 60));

  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));

  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);

  const seconds = totalSeconds % 60;

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
