'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { register as registerRequest } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

type Role = 'BUYER' | 'SELLER';

export default function RegisterForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('BUYER');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      const result = await registerRequest({
        name,
        email,
        password,
        role,
      });

      if (result.requiresTwoFactorSetup) {
        if (result.setupToken) {
          sessionStorage.setItem(
            'hammr_2fa_setup_token',
            result.setupToken,
          );
        }

        router.push('/auth/2fa/setup');
        return;
      }

      if (result.user && result.accessToken) {
        login(result);
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create your account. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Brand */}
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-lg font-black text-white">
            H
          </span>

          <span className="text-2xl font-black tracking-tight text-gray-950">
            Hammr
          </span>
        </Link>

        <h1 className="mt-8 text-3xl font-black tracking-tight text-gray-950">
          Create your account
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Join the marketplace and start bidding.
        </p>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-xl shadow-gray-200/50 sm:p-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              Full name
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Your name"
              autoComplete="name"
              required
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3.5 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-gray-950 focus:bg-white focus:ring-4 focus:ring-gray-100"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="register-email"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              Email address
            </label>

            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3.5 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-gray-950 focus:bg-white focus:ring-4 focus:ring-gray-100"
            />
          </div>

          {/* Password */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="register-password"
                className="block text-sm font-semibold text-gray-800"
              >
                Password
              </label>

              <span className="text-xs font-medium text-gray-400">
                Minimum 8 characters
              </span>
            </div>

            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Create a strong password"
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3.5 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-gray-950 focus:bg-white focus:ring-4 focus:ring-gray-100"
            />
          </div>

          {/* Role */}
          <div>
            <p className="mb-3 text-sm font-semibold text-gray-800">
              I want to join as
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('BUYER')}
                className={`rounded-2xl border p-4 text-left transition ${
                  role === 'BUYER'
                    ? 'border-black bg-black text-white shadow-lg'
                    : 'border-gray-200 bg-gray-50 text-gray-900 hover:border-gray-400'
                }`}
              >
                <span className="mb-2 block text-lg">
                  🛒
                </span>

                <span className="block text-sm font-bold">
                  Buyer
                </span>

                <span
                  className={`mt-1 block text-xs ${
                    role === 'BUYER'
                      ? 'text-gray-300'
                      : 'text-gray-500'
                  }`}
                >
                  Discover & bid
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRole('SELLER')}
                className={`rounded-2xl border p-4 text-left transition ${
                  role === 'SELLER'
                    ? 'border-black bg-black text-white shadow-lg'
                    : 'border-gray-200 bg-gray-50 text-gray-900 hover:border-gray-400'
                }`}
              >
                <span className="mb-2 block text-lg">
                  🏷️
                </span>

                <span className="block text-sm font-bold">
                  Seller
                </span>

                <span
                  className={`mt-1 block text-xs ${
                    role === 'SELLER'
                      ? 'text-gray-300'
                      : 'text-gray-500'
                  }`}
                >
                  List & sell
                </span>
              </button>
            </div>
          </div>

          {/* Seller information */}
          {role === 'SELLER' && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-bold text-gray-900">
                Seller security
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Seller accounts require two-factor
                authentication during setup and login.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/10 transition hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? 'Creating your account...'
              : role === 'SELLER'
                ? 'Create Seller Account'
                : 'Create Buyer Account'}
          </button>
        </form>

        {/* Login */}
        <div className="my-7 flex items-center gap-4">
          <div className="h-px flex-1 bg-gray-200" />

          <span className="text-xs font-medium text-gray-400">
            ALREADY A MEMBER?
          </span>

          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <Link
          href="/auth/login"
          className="block w-full rounded-xl border border-gray-300 px-5 py-3.5 text-center text-sm font-bold text-gray-900 transition hover:border-gray-950 hover:bg-gray-50"
        >
          Sign in instead
        </Link>
      </div>

      <p className="mt-6 text-center text-xs leading-5 text-gray-400">
        Your password is securely processed by the Hammr
        authentication system.
      </p>
    </div>
  );
}