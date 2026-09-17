'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import BuyerNavbar from '@/components/BuyerNavbar';
import { getListings } from '@/lib/listing';

export default function BuyerDashboardPage() {
  const [listings, setListings] = useState<Listing[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadListings() {
      try {
        setLoading(true);
        setError('');

        const data = await getListings();

        setListings(data);
      } catch (err) {
        console.error(err);
        setError('Unable to load auctions.');
      } finally {
        setLoading(false);
      }
    }

    loadListings();
  }, []);

  const availableAuctions = listings.filter(
    (listing) => listing.status === 'LIVE' || listing.status === 'SCHEDULED',
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <BuyerNavbar />

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Dashboard Header */}
        <section>
          <p className="text-sm font-semibold tracking-wider text-gray-500 uppercase">Buyer</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Buyer Dashboard
          </h1>

          <p className="mt-2 max-w-2xl text-gray-600">
            Browse auctions, manage your bids, and keep track of auctions you win.
          </p>
        </section>

        {/* Quick Stats */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm font-medium text-gray-500">Available Auctions</p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {loading ? '—' : availableAuctions.length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm font-medium text-gray-500">My Bids</p>

            <p className="mt-2 text-3xl font-bold text-gray-900">—</p>

            <p className="mt-1 text-xs text-gray-500">Bidding history coming next</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm font-medium text-gray-500">Won Auctions</p>

            <p className="mt-2 text-3xl font-bold text-gray-900">—</p>

            <p className="mt-1 text-xs text-gray-500">Settlement tracking coming next</p>
          </div>
        </section>

        {/* All Auctions */}
        <section className="mt-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">All Auctions</h2>

              <p className="mt-1 text-sm text-gray-600">Browse live and upcoming auctions.</p>
            </div>

            <Link href="/" className="text-sm font-semibold text-gray-900 hover:underline">
              Browse Home →
            </Link>
          </div>

          {loading && (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
              <p className="text-gray-600">Loading auctions...</p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {!loading && !error && availableAuctions.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900">No auctions available</h3>

              <p className="mt-2 text-sm text-gray-600">
                Check back soon for live and upcoming auctions.
              </p>
            </div>
          )}

          {!loading && !error && availableAuctions.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {availableAuctions.map((listing) => (
                <article
                  key={listing.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Image */}
                  <div className="flex h-52 items-center justify-center bg-gray-100">
                    {listing.images?.[0] ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm text-gray-500">No image</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          listing.status === 'LIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {listing.status === 'LIVE' ? 'LIVE' : 'UPCOMING'}
                      </span>

                      <span className="truncate text-xs text-gray-500">{listing.category}</span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
                      {listing.description}
                    </p>

                    {/* Price / Time */}
                    <div className="mt-5 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Current highest bid</p>

                        <p className="mt-1 text-lg font-bold text-gray-900">
                          {formatPrice(listing.currentHighestBid)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {listing.status === 'SCHEDULED' ? 'Starts' : 'Ends'}
                        </p>

                        <p className="mt-1 text-xs font-medium text-gray-700">
                          {formatDate(
                            listing.status === 'SCHEDULED'
                              ? listing.scheduledStartAt
                              : listing.currentEndAt,
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="mt-5">
                      <Link
                        href={`/auctions/${listing.id}`}
                        className="flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                      >
                        {listing.status === 'LIVE' ? 'View & Bid' : 'View Auction'}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* My Bids */}
        <section className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Bids</h2>

            <p className="mt-1 text-sm text-gray-600">Track auctions where you have placed bids.</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
              $
            </div>

            <h3 className="mt-4 text-lg font-semibold text-gray-900">No bids yet</h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
              Your bidding history will appear here once you start bidding on auctions.
            </p>

            <Link
              href="/"
              className="mt-5 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Find Auctions
            </Link>
          </div>
        </section>

        {/* Won Auctions */}
        <section className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Won Auctions</h2>

            <p className="mt-1 text-sm text-gray-600">
              Auctions you have won and need to complete.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
              ✓
            </div>

            <h3 className="mt-4 text-lg font-semibold text-gray-900">No won auctions</h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
              When you win an auction, it will appear here along with the payment information.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

type Listing = {
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

function formatPrice(price: number | string | null) {
  if (price === null || price === undefined) {
    return '—';
  }

  return `$${Number(price).toFixed(2)}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}
