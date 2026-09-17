'use client';

import { FormEvent, useEffect, useState } from 'react';

interface BidFormProps {
  minimumNextBid: string;
  disabled: boolean;
  onSubmit: (
    amount: string,
  ) => Promise<void>;
}

export default function BidForm({
  minimumNextBid,
  disabled,
  onSubmit,
}: BidFormProps) {
  const [amount, setAmount] =
    useState('');

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState('');

  useEffect(() => {
    setAmount(minimumNextBid);
  }, [minimumNextBid]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');

    const numericAmount =
      Number(amount);

    const minimum =
      Number(minimumNextBid);

    if (
      !Number.isFinite(
        numericAmount,
      )
    ) {
      setError(
        'Enter a valid bid amount.',
      );

      return;
    }

    if (
      numericAmount < minimum
    ) {
      setError(
        `Your bid must be at least $${minimum.toFixed(
          2,
        )}.`,
      );

      return;
    }

    try {
      setSubmitting(true);

      await onSubmit(
        numericAmount.toFixed(2),
      );

      /*
       * The Socket.IO event will update
       * the minimum amount.
       */
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to place bid.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Place your bid
        </p>

        <p className="mt-2 text-sm text-gray-600">
          Minimum next bid
        </p>

        <p className="text-2xl font-black text-gray-900">
          ${minimumNextBid}
        </p>
      </div>

      <div className="mt-5">
        <label
          htmlFor="bid-amount"
          className="mb-2 block text-sm font-semibold text-gray-700"
        >
          Your bid
        </label>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            $
          </span>

          <input
            id="bid-amount"
            type="number"
            min={minimumNextBid}
            step="0.01"
            value={amount}
            onChange={(event) =>
              setAmount(
                event.target.value,
              )
            }
            disabled={
              disabled ||
              submitting
            }
            className="w-full rounded-xl border border-gray-300 py-3 pl-8 pr-4 text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
            placeholder={minimumNextBid}
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={
          disabled ||
          submitting
        }
        className="mt-5 w-full rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {submitting
          ? 'Placing bid...'
          : 'Place Bid'}
      </button>

      {disabled && (
        <p className="mt-3 text-center text-xs text-gray-500">
          Bidding is currently unavailable.
        </p>
      )}
    </form>
  );
}