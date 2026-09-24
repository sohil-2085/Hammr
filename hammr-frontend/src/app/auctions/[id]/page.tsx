'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import BuyerNavbar from '@/components/BuyerNavbar';
import AuctionCountdown from '@/components/AuctionCountdown';
import BidForm from '@/components/BidForm';
import BidHistory from '@/components/BidHistory';

import { useAuctionCountdown } from '@/hooks/useAuctionCountdown';
import { useAuth } from '@/hooks/useAuth';

import { getAuctionBidHistory, getAuctionDetail, placeBid } from '@/lib/auction-api';

import { getAccessToken } from '@/lib/api';

import { createAuctionSocket } from '@/lib/socket';

import type {
  AuctionDetail,
  BidHistoryItem,
  BidNewEvent,
  AuctionExtendedEvent,
  AuctionStartedEvent,
  AuctionClosedEvent,
  BidOutbidEvent,
} from '@/types/auction';

export default function AuctionDetailPage() {
  const params = useParams();

  const listingId = typeof params.id === 'string' ? params.id : '';

  const { user } = useAuth();

  const [auction, setAuction] = useState<AuctionDetail | null>(null);

  const [bids, setBids] = useState<BidHistoryItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [socketConnected, setSocketConnected] = useState(false);

  const [notice, setNotice] = useState('');

  /*
   * Load auction and bid history.
   */
  const loadAuction = useCallback(async () => {
    if (!listingId) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const [auctionData, bidData] = await Promise.all([
        getAuctionDetail(listingId),
        getAuctionBidHistory(listingId),
      ]);

      setAuction(auctionData);
      setBids(bidData);
    } catch (err) {
      console.error(err);

      setError(err instanceof Error ? err.message : 'Unable to load auction.');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  /*
   * Load auction when listing ID changes.
   */
  useEffect(() => {
    loadAuction();
  }, [loadAuction]);

  /*
   * IMPORTANT:
   *
   * This hook MUST be called on every render.
   *
   * Do NOT put it after:
   *
   * if (loading) return ...
   *
   * or:
   *
   * if (error || !auction) return ...
   *
   * Otherwise React will throw error #310.
   *
   * Safe fallback values are used while the
   * auction is still loading.
   */
  const countdown = useAuctionCountdown({
    status: auction?.status ?? 'SCHEDULED',

    scheduledStartAt: auction?.scheduledStartAt ?? new Date().toISOString(),

    currentEndAt: auction?.currentEndAt ?? new Date().toISOString(),
  });

  /*
   * Socket.IO connection.
   *
   * Backend requires JWT authentication.
   */
  useEffect(() => {
    if (!listingId) {
      return;
    }

    const token = getAccessToken();

    /*
     * No authenticated token:
     *
     * REST detail still works,
     * but the current backend Socket.IO
     * configuration requires authentication.
     */
    if (!token) {
      return;
    }

    const socket = createAuctionSocket(token);

    function handleConnect() {
      setSocketConnected(true);

      socket.emit('auction:join', listingId);
    }

    function handleDisconnect() {
      setSocketConnected(false);
    }

    /*
     * New bid received.
     */
    function handleBidNew(event: BidNewEvent) {
      if (event.bid.listingId !== listingId) {
        return;
      }

      setAuction((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,

          currentHighestBid: event.currentHighestBid,

          currentHighestBidderId: event.currentHighestBidderId,

          currentEndAt: event.currentEndAt,

          extensionCount: event.extensionCount,

          status: 'LIVE',
        };
      });

      /*
       * Add the new bid to the history.
       */
      setBids((current) => {
        const exists = current.some((bid) => bid.id === event.bid.id);

        if (exists) {
          return current;
        }

        return [
          {
            id: event.bid.id,

            bidderName: event.bid.bidderName,

            amount: event.bid.amount,

            createdAt: event.bid.createdAt,
          },

          ...current,
        ];
      });
    }

    /*
     * Auction extended.
     */
    function handleAuctionExtended(event: AuctionExtendedEvent) {
      if (event.listingId !== listingId) {
        return;
      }

      setAuction((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,

          currentEndAt: event.currentEndAt,

          extensionCount: event.extensionCount,

          status: 'LIVE',
        };
      });

      setNotice('Auction extended by 2 minutes because of a late bid.');

      window.setTimeout(() => {
        setNotice('');
      }, 4000);
    }

    /*
     * Auction started.
     */
    function handleAuctionStarted(event: AuctionStartedEvent) {
      if (event.listingId !== listingId) {
        return;
      }

      setAuction((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          status: 'LIVE',
        };
      });
    }

    /*
     * Auction closed.
     */
    function handleAuctionClosed(event: AuctionClosedEvent) {
      if (event.listingId !== listingId) {
        return;
      }

      setAuction((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          status: 'CLOSED',
        };
      });

      setNotice('This auction has closed.');
    }

    /*
     * Private outbid notification.
     */
    function handleOutbid(event: BidOutbidEvent) {
      if (event.listingId !== listingId) {
        return;
      }

      setNotice(`You have been outbid. New highest bid: $${event.newHighestBid}.`);

      window.setTimeout(() => {
        setNotice('');
      }, 5000);
    }

    /*
     * Register Socket.IO listeners.
     */
    socket.on('connect', handleConnect);

    socket.on('disconnect', handleDisconnect);

    socket.on('bid:new', handleBidNew);

    socket.on('auction:extended', handleAuctionExtended);

    socket.on('auction:started', handleAuctionStarted);

    socket.on('auction:closed', handleAuctionClosed);

    socket.on('bid:outbid', handleOutbid);

    /*
     * Cleanup.
     */
    return () => {
      socket.emit('auction:leave', listingId);

      socket.off('connect', handleConnect);

      socket.off('disconnect', handleDisconnect);

      socket.off('bid:new', handleBidNew);

      socket.off('auction:extended', handleAuctionExtended);

      socket.off('auction:started', handleAuctionStarted);

      socket.off('auction:closed', handleAuctionClosed);

      socket.off('bid:outbid', handleOutbid);

      socket.disconnect();
    };
  }, [listingId]);

  /*
   * Calculate minimum next bid from
   * the current server state.
   *
   * Reserve price is never exposed.
   */
  const minimumNextBid = useMemo(() => {
    if (!auction) {
      return '0.00';
    }

    if (auction.currentHighestBid !== null) {
      return (Number(auction.currentHighestBid) + Number(auction.minIncrement)).toFixed(2);
    }

    return Number(auction.startingPrice).toFixed(2);
  }, [auction]);

  /*
   * Place bid.
   */
  async function handlePlaceBid(amount: string) {
    if (!listingId) {
      return;
    }

    /*
     * User must be logged in.
     */
    if (!user) {
      throw new Error('Please log in as a buyer to place a bid.');
    }

    /*
     * Only BUYER accounts can bid.
     */
    if (user.role !== 'BUYER') {
      throw new Error('Only buyers can place bids.');
    }

    /*
     * Server validates the auction and bid.
     *
     * Socket.IO will update the UI with
     * the resulting bid:new event.
     */
    await placeBid(listingId, amount);

    setNotice('Bid submitted successfully.');

    window.setTimeout(() => {
      setNotice('');
    }, 3000);
  }

  /*
   * Loading state.
   *
   * IMPORTANT:
   * All hooks have already been called above.
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <BuyerNavbar />

        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-600">Loading auction...</p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * Error state.
   */
  if (error || !auction) {
    return (
      <main className="min-h-screen bg-gray-50">
        <BuyerNavbar />

        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <h1 className="text-xl font-bold text-red-800">Unable to load auction</h1>

            <p className="mt-2 text-sm text-red-700">{error || 'Auction not found.'}</p>

            <Link
              href="/"
              className="mt-5 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white"
            >
              Back to Auctions
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /*
   * Buyer role.
   */
  const isBuyer = user?.role === 'BUYER';

  /*
   * IMPORTANT:
   *
   * Use the clock-based countdown phase
   * rather than the potentially stale database
   * status for the UI.
   */
  const isLive = countdown.phase === 'LIVE';

  /*
   * Only logged-in buyers can bid,
   * and only while the auction is LIVE.
   */
  const canBid = isBuyer && isLive;

  return (
    <main className="min-h-screen bg-gray-50">
      <BuyerNavbar />

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-900">
            â† Back to Auctions
          </Link>
        </div>

        {/* Notification */}
        {notice && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-gray-200 bg-white p-4 text-sm font-medium text-gray-900 shadow-sm"
          >
            {notice}
          </div>
        )}

        {/* Socket status */}
        {user && (
          <div className="mb-6 flex items-center gap-2 text-xs text-gray-500">
            <span
              className={`h-2 w-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-gray-300'}`}
            />

            {socketConnected ? 'Live updates connected' : 'Connecting to live updates...'}
          </div>
        )}

        {/* Main layout */}
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          {/* Left */}
          <div>
            {/* Image */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="flex aspect-[16/10] items-center justify-center bg-gray-100">
                {auction.images?.[0] ? (
                  <img
                    src={auction.images[0]}
                    alt={auction.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm text-gray-500">No image</span>
                )}
              </div>
            </div>

            {/* Auction information */}
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                {/* IMPORTANT:
                    Display countdown phase,
                    not stale database status. */}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    countdown.phase === 'LIVE'
                      ? 'bg-green-100 text-green-700'
                      : countdown.phase === 'SCHEDULED'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {countdown.phase}
                </span>

                <span className="text-sm text-gray-500">{auction.category}</span>
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                {auction.title}
              </h1>

              <p className="mt-5 text-base leading-7 whitespace-pre-line text-gray-600">
                {auction.description}
              </p>

              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                {/* Starting price */}
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-500">Starting Price</p>

                  <p className="mt-1 text-lg font-bold text-gray-900">
                    ${Number(auction.startingPrice).toFixed(2)}
                  </p>
                </div>

                {/* Highest bid */}
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-500">Current Highest Bid</p>

                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {auction.currentHighestBid === null
                      ? 'No bids'
                      : `$${Number(auction.currentHighestBid).toFixed(2)}`}
                  </p>
                </div>

                {/* Increment */}
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-500">Bid Increment</p>

                  <p className="mt-1 text-lg font-bold text-gray-900">
                    ${Number(auction.minIncrement).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Bid History */}
            <div className="mt-6">
              <BidHistory bids={bids} />
            </div>
          </div>

          {/* Right */}
          <aside className="space-y-6">
            {/* Countdown */}
            <AuctionCountdown
              status={auction.status}
              scheduledStartAt={auction.scheduledStartAt}
              currentEndAt={auction.currentEndAt}
            />

            {/* Current bid */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
                Current Highest Bid
              </p>

              <p className="mt-2 text-4xl font-black text-gray-950">
                {auction.currentHighestBid === null
                  ? `$${Number(auction.startingPrice).toFixed(2)}`
                  : `$${Number(auction.currentHighestBid).toFixed(2)}`}
              </p>

              {auction.currentHighestBid === null && (
                <p className="mt-2 text-xs text-gray-500">No bids have been placed yet.</p>
              )}
            </div>

            {/* Bid form or Winner section */}
            {countdown.phase === 'CLOSED' ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">
                  {auction.winner?.id === user?.id ? '🎉 Congratulations!' : 'Auction Concluded'}
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  {auction.winner?.id === user?.id
                    ? `You won this auction with a bid of $${Number(auction.currentHighestBid).toFixed(2)}.`
                    : 'This auction has ended and is no longer accepting bids.'}
                </p>
              </div>
            ) : isBuyer ? (
              <BidForm
                minimumNextBid={minimumNextBid}
                disabled={!canBid}
                onSubmit={handlePlaceBid}
              />
            ) : !user ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">Want to bid?</h2>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Log in with a Buyer account to place a bid.
                </p>

                <Link
                  href="/auth/login"
                  className="mt-5 flex w-full items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Login to Bid
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">Seller Account</h2>

                <p className="mt-2 text-sm text-gray-600">Sellers cannot place bids.</p>
              </div>
            )}

            {/* Auction details */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Auction Details</h2>

              <dl className="mt-5 space-y-4">
                <div className="flex justify-between gap-4">
                  <dt className="text-sm text-gray-500">Category</dt>

                  <dd className="text-right text-sm font-semibold text-gray-900">
                    {auction.category}
                  </dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-sm text-gray-500">Original End</dt>

                  <dd className="text-right text-sm font-semibold text-gray-900">
                    {new Date(auction.scheduledEndAt).toLocaleString()}
                  </dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-sm text-gray-500">Extensions</dt>

                  <dd className="text-right text-sm font-semibold text-gray-900">
                    {auction.extensionCount}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
