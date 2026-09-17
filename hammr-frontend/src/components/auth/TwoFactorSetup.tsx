'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { setupTwoFactor, verifyTwoFactor } from '@/lib/api';

import { useAuth } from '@/hooks/useAuth';

export default function TwoFactorSetup() {
  const router = useRouter();
  const { login } = useAuth();

  const [qrCode, setQrCode] = useState('');

  const [secret, setSecret] = useState('');

  const [code, setCode] = useState('');

  const [error, setError] = useState('');

  const [loading, setLoading] = useState(true);

  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('hammr_2fa_setup_token');

    if (!token) {
      router.replace('/auth/login');

      return;
    }

    const setupToken = token;

    async function initialize() {
      try {
        const result = await setupTwoFactor(setupToken);

        setQrCode(result.qrCode);
        setSecret(result.secret);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unable to initialize 2FA.');
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, [router]);

  async function handleVerify() {
    const token = sessionStorage.getItem('hammr_2fa_setup_token');

    if (!token) {
      router.replace('/auth/login');

      return;
    }

    setError('');
    setVerifying(true);

    try {
      const result = await verifyTwoFactor(token, code);

      sessionStorage.removeItem('hammr_2fa_setup_token');

      if ('accessToken' in result && result.accessToken && result.user) {
        login(result);
        router.push('/');
        return;
      }

      router.push('/auth/login');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Invalid authenticator code.');
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
        Setting up two-factor authentication...
      </div>
    );
  }

  if (error && !qrCode) {
    return (
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-gray-800 shadow-sm">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>

        <button
          onClick={() => router.push('/auth/login')}
          className="mt-5 w-full rounded-lg bg-black px-4 py-3 text-white"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold">Secure your Seller account</h1>

      <p className="mt-2 text-sm text-zinc-500">
        Scan this QR code with Google Authenticator, Microsoft Authenticator, or another TOTP app.
      </p>

      {qrCode && (
        <div className="my-6 flex justify-center">
          <img
            src={qrCode}
            alt="Hammr authenticator QR code"
            className="h-56 w-56 rounded-lg border p-2"
          />
        </div>
      )}

      <div className="mb-6">
        <p className="mb-2 text-xs font-medium tracking-wide text-zinc-500 uppercase">
          Manual setup key
        </p>

        <code className="block rounded-lg bg-zinc-100 p-3 text-sm break-all">{secret}</code>
      </div>

      <label htmlFor="code" className="mb-2 block text-sm font-medium">
        Enter the 6-digit code
      </label>

      <input
        id="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
        placeholder="000000"
        className="mb-4 w-full rounded-lg border px-3 py-3 text-center text-2xl tracking-[0.4em]"
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleVerify}
        disabled={verifying || code.length !== 6}
        className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        {verifying ? 'Verifying...' : 'Enable 2FA'}
      </button>
    </div>
  );
}
