'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import Navbar from '@/components/Navbar';

import {
  getListings,
  type Listing,
} from '@/lib/listing';

function formatPrice(
  price: number | string | null,
) {
  if (price === null || price === undefined) {
    return '—';
  }

  return `$${Number(price).toFixed(2)}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

export default function HomePage() {
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

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <Navbar />

      {/* Hero */}
      <section className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-600">
            Live Auctions
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Find something worth bidding on.
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-gray-600">
            Discover live and upcoming auctions from
            Hammr sellers.
          </p>
        </div>
      </section>

      {/* Auctions */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Auctions
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Live and upcoming items
            </p>
          </div>
        </div>

        {loading && (
          <div className="py-16 text-center text-gray-600">
            Loading auctions...
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          listings.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                No auctions yet
              </h3>

              <p className="mt-2 text-gray-600">
                Check back soon for new listings.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          listings.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/auctions/${listing.id}`}
                  className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex h-52 items-center justify-center bg-gray-100">
                    {listing.images?.[0] ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm text-gray-500">
                        No image
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                        {listing.status}
                      </span>

                      <span className="text-xs text-gray-500">
                        {listing.category}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 group-hover:underline">
                      {listing.title}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                      {listing.description}
                    </p>

                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <p className="text-xs text-gray-500">
                          Current highest bid
                        </p>

                        <p className="text-xl font-bold text-gray-900">
                          {formatPrice(
                            listing.currentHighestBid,
                          )}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {listing.status === 'SCHEDULED'
                            ? 'Starts'
                            : 'Ends'}
                        </p>

                        <p className="text-xs font-medium text-gray-700">
                          {formatDate(
                            listing.status ===
                              'SCHEDULED'
                              ? listing.scheduledStartAt
                              : listing.currentEndAt,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
      </section>
    </main>
  );
}