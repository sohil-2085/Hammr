'use client';

import { useRouter } from 'next/navigation';

import ListingForm from '@/components/ListingForm';

export default function CreateListingPage() {
  const router = useRouter();

  function handleSuccess() {
    // router.push('/seller/dashboard');
    router.push('/');
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Seller
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Create Listing
          </h1>

          <p className="mt-2 max-w-2xl text-gray-600">
            Create a new auction and give buyers something worth
            bidding on.
          </p>
        </div>

        <ListingForm onSuccess={handleSuccess} />
      </div>
    </main>
  );
}