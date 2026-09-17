'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import SellerNavbar from '@/components/SellerNavbar';
import { getMyListings } from '@/lib/listing';

type Listing = {
  id: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  startingPrice: number | string;
  reservePrice?: number | string | null;
  currentHighestBid: number | string | null;
  scheduledStartAt: string;
  scheduledEndAt?: string;
  currentEndAt: string;
  status: 'SCHEDULED' | 'LIVE' | 'CLOSED';
};

function formatPrice(price: number | string | null | undefined) {
  if (price === null || price === undefined) {
    return '—';
  }

  return `$${Number(price).toFixed(2)}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

function getStatusClasses(status: Listing['status']) {
  switch (status) {
    case 'LIVE':
      return 'bg-green-100 text-green-700';

    case 'CLOSED':
      return 'bg-gray-200 text-gray-700';

    case 'SCHEDULED':
    default:
      return 'bg-blue-100 text-blue-700';
  }
}

export default function SellerDashboardPage() {
  const [listings, setListings] = useState<Listing[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMyListings() {
      try {
        setLoading(true);
        setError('');

        const data = await getMyListings();

        setListings(data);
      } catch (err) {
        console.error(err);

        setError(err instanceof Error ? err.message : 'Unable to load your listings.');
      } finally {
        setLoading(false);
      }
    }

    loadMyListings();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <SellerNavbar />

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wider text-gray-500 uppercase">Seller</p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              Seller Dashboard
            </h1>

            <p className="mt-2 text-gray-600">Manage your auctions and listings.</p>
          </div>

          <Link
            href="/seller/listings/create"
            className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
          >
            + Create Listing
          </Link>
        </div>

        {/* Summary */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm font-medium text-gray-500">Total Listings</p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {loading ? '—' : listings.length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm font-medium text-gray-500">Live Auctions</p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {loading ? '—' : listings.filter((listing) => listing.status === 'LIVE').length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm font-medium text-gray-500">Scheduled</p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {loading ? '—' : listings.filter((listing) => listing.status === 'SCHEDULED').length}
            </p>
          </div>
        </div>

        {/* Listings */}
        <section className="mt-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Listings</h2>

            <p className="mt-1 text-sm text-gray-600">Manage the auctions you have created.</p>
          </div>

          {loading && (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
              <p className="text-sm text-gray-600">Loading your listings...</p>
            </div>
          )}

          {!loading && error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {!loading && !error && listings.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900">You have no listings yet</h3>

              <p className="mt-2 text-sm text-gray-600">
                Create your first auction to start selling on Hammr.
              </p>

              <Link
                href="/seller/listings/create"
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Create Your First Listing
              </Link>
            </div>
          )}

          {!loading && !error && listings.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                        Listing
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                        Category
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                        Status
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                        Starting Price
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                        Highest Bid
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                        Schedule
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {listings.map((listing) => (
                      <tr key={listing.id} className="transition hover:bg-gray-50">
                        {/* Listing */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                              {listing.images?.[0] ? (
                                <img
                                  src={listing.images[0]}
                                  alt={listing.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                                  No image
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-gray-900">
                                {listing.title}
                              </p>

                              <p className="mt-1 max-w-xs truncate text-sm text-gray-500">
                                {listing.description}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-5">
                          <span className="text-sm text-gray-700">{listing.category}</span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                              listing.status,
                            )}`}
                          >
                            {listing.status}
                          </span>
                        </td>

                        {/* Starting Price */}
                        <td className="px-6 py-5">
                          <span className="text-sm font-medium text-gray-900">
                            {formatPrice(listing.startingPrice)}
                          </span>
                        </td>

                        {/* Highest Bid */}
                        <td className="px-6 py-5">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatPrice(listing.currentHighestBid)}
                          </span>
                        </td>

                        {/* Schedule */}
                        <td className="px-6 py-5">
                          <div className="text-xs text-gray-500">
                            <p>Starts: {formatDate(listing.scheduledStartAt)}</p>

                            <p className="mt-1">Ends: {formatDate(listing.currentEndAt)}</p>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
