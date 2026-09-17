'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';

export default function BuyerNavbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push('/auth/login');
    router.refresh();
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Brand */}
        <Link
          href="/buyer/dashboard"
          className="flex items-center gap-3"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-lg font-black text-white">
            H
          </span>

          <span className="text-xl font-black tracking-tight text-gray-950">
            Hammr
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/buyer/dashboard"
            className="text-sm font-semibold text-gray-900"
          >
            Dashboard
          </Link>

          <Link
            href="/"
            className="text-sm font-medium text-gray-600 transition hover:text-gray-950"
          >
            Browse Auctions
          </Link>
        </nav>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-gray-900">
              {user?.name ?? 'Buyer'}
            </p>

            <p className="text-xs text-gray-500">
              Buyer
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:border-gray-900 hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}