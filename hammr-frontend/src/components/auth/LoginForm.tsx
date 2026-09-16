'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { login as loginRequest } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const [requiresTwoFactor, setRequiresTwoFactor] =
    useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      const result = await loginRequest({
        email,
        password,
        ...(requiresTwoFactor
          ? { twoFactorCode }
          : {}),
      });

      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        return;
      }

      if (result.requiresTwoFactorSetup) {
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
          : 'Unable to sign in. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Brand */}
      <div className="mb-10 text-center">
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
          Welcome back
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Sign in to continue bidding and winning.
        </p>
      </div>

      {/* Card */}
      <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-xl shadow-gray-200/50 sm:p-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              Email address
            </label>

            <input
              id="email"
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
                htmlFor="password"
                className="block text-sm font-semibold text-gray-800"
              >
                Password
              </label>

              <span className="text-xs font-medium text-gray-400">
                8+ characters
              </span>
            </div>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3.5 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-gray-950 focus:bg-white focus:ring-4 focus:ring-gray-100"
            />
          </div>

          {/* Seller 2FA */}
          {requiresTwoFactor && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3">
                <p className="text-sm font-bold text-gray-900">
                  Two-factor authentication
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Enter the 6-digit code from your
                  authenticator app.
                </p>
              </div>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={twoFactorCode}
                onChange={(event) =>
                  setTwoFactorCode(
                    event.target.value
                      .replace(/\D/g, '')
                      .slice(0, 6),
                  )
                }
                placeholder="000000"
                autoComplete="one-time-code"
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-center text-lg font-bold tracking-[0.5em] text-gray-950 outline-none focus:border-gray-950 focus:ring-4 focus:ring-gray-100"
              />
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
              ? 'Signing you in...'
              : requiresTwoFactor
                ? 'Verify & Sign In'
                : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-7 flex items-center gap-4">
          <div className="h-px flex-1 bg-gray-200" />

          <span className="text-xs font-medium text-gray-400">
            NEW TO HAMMR?
          </span>

          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <Link
          href="/auth/register"
          className="block w-full rounded-xl border border-gray-300 px-5 py-3.5 text-center text-sm font-bold text-gray-900 transition hover:border-gray-950 hover:bg-gray-50"
        >
          Create an account
        </Link>
      </div>

      <p className="mt-6 text-center text-xs leading-5 text-gray-400">
        By continuing, you agree to use Hammr responsibly
        and securely.
      </p>
    </div>
  );
}