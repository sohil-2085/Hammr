'use client';

import {
  FormEvent,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

import {
  register as registerRequest,
} from '@/lib/api';

import { useAuth } from '@/hooks/useAuth';

export default function RegisterForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [name, setName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [role, setRole] =
    useState<'BUYER' | 'SELLER'>(
      'BUYER',
    );

  const [error, setError] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      const result =
        await registerRequest({
          name,
          email,
          password,
          role,
        });

      if (
        result.requiresTwoFactorSetup
      ) {
        if (!result.setupToken) {
          throw new Error(
            '2FA setup token was not returned.',
          );
        }

        sessionStorage.setItem(
          'hammr_2fa_setup_token',
          result.setupToken,
        );

        router.push(
          '/auth/2fa/setup',
        );

        return;
      }

      login(result);

      router.push('/');
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Registration failed.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm text-gray-800">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Create your Hammr account
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Choose whether you're buying or selling.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium"
          >
            Name
          </label>

          <input
            id="name"
            type="text"
            required
            minLength={2}
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium"
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            className="w-full rounded-lg border px-3 py-2"
          />

          <p className="mt-1 text-xs text-zinc-500">
            Minimum 8 characters.
          </p>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">
            Account type
          </legend>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                setRole('BUYER')
              }
              className={`rounded-lg border px-4 py-3 ${
                role === 'BUYER'
                  ? 'border-black bg-black text-white'
                  : 'bg-white'
              }`}
            >
              Buyer
            </button>

            <button
              type="button"
              onClick={() =>
                setRole('SELLER')
              }
              className={`rounded-lg border px-4 py-3 ${
                role === 'SELLER'
                  ? 'border-black bg-black text-white'
                  : 'bg-white'
              }`}
            >
              Seller
            </button>
          </div>
        </fieldset>

        {role === 'SELLER' && (
          <div className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">
            Seller accounts require authenticator-app
            2FA before normal login.
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
          {loading
            ? 'Creating account...'
            : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <a
          href="/auth/login"
          className="font-medium text-black underline"
        >
          Sign in
        </a>
      </p>
    </div>
  );
}