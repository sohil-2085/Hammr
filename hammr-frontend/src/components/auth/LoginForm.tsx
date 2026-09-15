'use client';

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

  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

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
          ? {
              twoFactorCode,
            }
          : {}),
      });

      if (result.requiresTwoFactorSetup) {
        if (!result.setupToken) {
          throw new Error('2FA setup token was not returned.');
        }

        sessionStorage.setItem('hammr_2fa_setup_token', result.setupToken);

        router.push('/auth/2fa/setup');

        return;
      }

      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        return;
      }

      login(result);

      router.push('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 text-gray-800 shadow-sm">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome to Hammr</h1>

        <p className="mt-2 text-sm">Sign in to your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Email
          </label>

          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            Password
          </label>

          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
          />
        </div>

        {requiresTwoFactor && (
          <div>
            <label htmlFor="twoFactorCode" className="mb-2 block text-sm font-medium">
              Authenticator code
            </label>

            <input
              id="twoFactorCode"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="\d{6}"
              required
              value={twoFactorCode}
              onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, ''))}
              className="w-full rounded-lg border px-3 py-2 text-center text-xl tracking-[0.4em] outline-none focus:ring-2"
              placeholder="000000"
            />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Signing in...' : requiresTwoFactor ? 'Verify & Sign In' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Don't have an account?{' '}
        <a href="/auth/register" className="font-medium text-black underline">
          Register
        </a>
      </p>
    </div>
  );
}
