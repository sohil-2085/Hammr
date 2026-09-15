'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const router = useRouter();

  const { user, logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      router.push('/auth/login');
      router.refresh();
    }
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-bold text-gray-900">
          Hammr
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            Auctions
          </Link>

          {user ? (
            <>
              <span className="text-sm text-gray-600">{user.name}</span>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Sign In
              </Link>

              <Link
                href="/auth/register"
                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
