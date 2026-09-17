'use client';

import { FormEvent, useState } from 'react';

import { createListing } from '@/lib/api';
import type { CreateListingInput } from '@/types/listing';

const initialForm: CreateListingInput = {
  title: '',
  description: '',
  images: [],
  category: '',
  startingPrice: '',
  reservePrice: '',
  scheduledStartAt: '',
  scheduledEndAt: '',
};

type ListingFormProps = {
  onSuccess?: () => void;
};

export default function ListingForm({
  onSuccess,
}: ListingFormProps) {
  const [form, setForm] =
    useState<CreateListingInput>(initialForm);

  const [imageUrls, setImageUrls] = useState('');

  const [errors, setErrors] = useState<
    Record<string, string>
  >({});

  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  function handleChange(
    field: keyof CreateListingInput,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: '',
    }));

    setSubmitError('');
    setSuccessMessage('');
  }

  function handleImageChange(value: string) {
    setImageUrls(value);

    setErrors((current) => ({
      ...current,
      images: '',
    }));

    setSubmitError('');
    setSuccessMessage('');
  }

  function validateForm() {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) {
      newErrors.title = 'Title is required.';
    }

    if (!form.description.trim()) {
      newErrors.description = 'Description is required.';
    }

    const images = imageUrls
      .split('\n')
      .map((url) => url.trim())
      .filter(Boolean);

    if (images.length === 0) {
      newErrors.images = 'At least one image URL is required.';
    } else {
      const invalidImage = images.find((url) => {
        try {
          const parsedUrl = new URL(url);

          return (
            parsedUrl.protocol !== 'http:' &&
            parsedUrl.protocol !== 'https:'
          );
        } catch {
          return true;
        }
      });

      if (invalidImage) {
        newErrors.images =
          'Each image must be a valid HTTP or HTTPS URL.';
      }
    }

    if (!form.category.trim()) {
      newErrors.category = 'Category is required.';
    }

    if (!form.startingPrice.trim()) {
      newErrors.startingPrice =
        'Starting price is required.';
    } else if (
      !/^\d+(\.\d{1,2})?$/.test(
        form.startingPrice.trim(),
      ) ||
      Number(form.startingPrice) <= 0
    ) {
      newErrors.startingPrice =
        'Enter a valid positive amount with up to 2 decimal places.';
    }

    if (form.reservePrice?.trim()) {
      if (
        !/^\d+(\.\d{1,2})?$/.test(
          form.reservePrice.trim(),
        ) ||
        Number(form.reservePrice) <= 0
      ) {
        newErrors.reservePrice =
          'Enter a valid positive amount with up to 2 decimal places.';
      } else if (
        Number(form.reservePrice) <
        Number(form.startingPrice)
      ) {
        newErrors.reservePrice =
          'Reserve price cannot be lower than the starting price.';
      }
    }

    if (!form.scheduledStartAt) {
      newErrors.scheduledStartAt =
        'Scheduled start time is required.';
    }

    if (!form.scheduledEndAt) {
      newErrors.scheduledEndAt =
        'Scheduled end time is required.';
    }

    if (
      form.scheduledStartAt &&
      form.scheduledEndAt &&
      new Date(form.scheduledEndAt) <=
        new Date(form.scheduledStartAt)
    ) {
      newErrors.scheduledEndAt =
        'Scheduled end time must be after the scheduled start time.';
    }

    return newErrors;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSubmitError('');
    setSuccessMessage('');

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const images = imageUrls
      .split('\n')
      .map((url) => url.trim())
      .filter(Boolean);

    const listingData: CreateListingInput = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      images,
      startingPrice: form.startingPrice.trim(),
      reservePrice:
        form.reservePrice?.trim() || undefined,
    };

    try {
      setIsSubmitting(true);

      await createListing(listingData);

      setSuccessMessage(
        'Listing created successfully. Redirecting...',
      );

      onSuccess?.();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Failed to create listing.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
    >
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-5 sm:px-8">
        <h2 className="text-xl font-semibold text-gray-900">
          Auction Details
        </h2>

        <p className="mt-1 text-sm text-gray-600">
          Add the details of the item you want to auction.
        </p>
      </div>

      <div className="space-y-8 px-6 py-8 sm:px-8">
        {/* Basic Information */}
        <section>
          <div className="mb-5">
            <h3 className="text-base font-semibold text-gray-900">
              Basic Information
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Tell buyers what you are selling.
            </p>
          </div>

          <div className="space-y-5">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-900"
              >
                Title <span className="text-red-500">*</span>
              </label>

              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={(event) =>
                  handleChange(
                    'title',
                    event.target.value,
                  )
                }
                placeholder="e.g. Vintage Canon Film Camera"
                maxLength={200}
                required
                aria-invalid={Boolean(errors.title)}
                aria-describedby={
                  errors.title
                    ? 'title-error'
                    : undefined
                }
                className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 ${
                  errors.title
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-300 focus:border-gray-900 focus:ring-gray-100'
                }`}
              />

              {errors.title && (
                <p
                  id="title-error"
                  className="mt-2 text-sm text-red-600"
                >
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-900"
                >
                  Description{' '}
                  <span className="text-red-500">*</span>
                </label>

                <span className="text-xs text-gray-400">
                  {form.description.length}/5000
                </span>
              </div>

              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={(event) =>
                  handleChange(
                    'description',
                    event.target.value,
                  )
                }
                placeholder="Describe the item, its condition, included accessories, and anything buyers should know..."
                rows={6}
                maxLength={5000}
                required
                aria-invalid={Boolean(
                  errors.description,
                )}
                className={`mt-2 w-full resize-y rounded-xl border px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 ${
                  errors.description
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-300 focus:border-gray-900 focus:ring-gray-100'
                }`}
              />

              {errors.description && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-900"
              >
                Category{' '}
                <span className="text-red-500">*</span>
              </label>

              <input
                id="category"
                name="category"
                type="text"
                value={form.category}
                onChange={(event) =>
                  handleChange(
                    'category',
                    event.target.value,
                  )
                }
                placeholder="e.g. Electronics"
                maxLength={100}
                required
                aria-invalid={Boolean(errors.category)}
                className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 ${
                  errors.category
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-300 focus:border-gray-900 focus:ring-gray-100'
                }`}
              />

              {errors.category && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.category}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Images */}
        <section className="border-t border-gray-100 pt-8">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-gray-900">
              Images
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Add at least one image. Enter one URL per
              line.
            </p>
          </div>

          <div>
            <label
              htmlFor="images"
              className="block text-sm font-medium text-gray-900"
            >
              Image URLs{' '}
              <span className="text-red-500">*</span>
            </label>

            <textarea
              id="images"
              name="images"
              value={imageUrls}
              onChange={(event) =>
                handleImageChange(event.target.value)
              }
              placeholder={
                'https://example.com/image-1.jpg\nhttps://example.com/image-2.jpg'
              }
              rows={5}
              required
              aria-invalid={Boolean(errors.images)}
              className={`mt-2 w-full resize-y rounded-xl border px-4 py-3 font-mono text-sm text-gray-900 outline-none transition placeholder:font-sans placeholder:text-gray-400 focus:ring-2 ${
                errors.images
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                  : 'border-gray-300 focus:border-gray-900 focus:ring-gray-100'
              }`}
            />

            <div className="mt-2 flex items-center justify-between gap-4">
              <p className="text-xs text-gray-500">
                HTTP and HTTPS image URLs are supported.
              </p>

              <span className="shrink-0 text-xs font-medium text-gray-500">
                {
                  imageUrls
                    .split('\n')
                    .map((url) => url.trim())
                    .filter(Boolean).length
                }{' '}
                image(s)
              </span>
            </div>

            {errors.images && (
              <p className="mt-2 text-sm text-red-600">
                {errors.images}
              </p>
            )}
          </div>
        </section>

        {/* Pricing */}
        <section className="border-t border-gray-100 pt-8">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-gray-900">
              Pricing
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Set the starting price and optional reserve
              price.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Starting Price */}
            <div>
              <label
                htmlFor="startingPrice"
                className="block text-sm font-medium text-gray-900"
              >
                Starting Price{' '}
                <span className="text-red-500">*</span>
              </label>

              <div className="relative mt-2">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  $
                </span>

                <input
                  id="startingPrice"
                  name="startingPrice"
                  type="text"
                  inputMode="decimal"
                  value={form.startingPrice}
                  onChange={(event) =>
                    handleChange(
                      'startingPrice',
                      event.target.value,
                    )
                  }
                  placeholder="100.00"
                  required
                  aria-invalid={Boolean(
                    errors.startingPrice,
                  )}
                  className={`w-full rounded-xl border py-3 pl-8 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 ${
                    errors.startingPrice
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                      : 'border-gray-300 focus:border-gray-900 focus:ring-gray-100'
                  }`}
                />
              </div>

              {errors.startingPrice && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.startingPrice}
                </p>
              )}
            </div>

            {/* Reserve Price */}
            <div>
              <label
                htmlFor="reservePrice"
                className="block text-sm font-medium text-gray-900"
              >
                Reserve Price{' '}
                <span className="text-xs font-normal text-gray-400">
                  (optional)
                </span>
              </label>

              <div className="relative mt-2">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  $
                </span>

                <input
                  id="reservePrice"
                  name="reservePrice"
                  type="text"
                  inputMode="decimal"
                  value={form.reservePrice ?? ''}
                  onChange={(event) =>
                    handleChange(
                      'reservePrice',
                      event.target.value,
                    )
                  }
                  placeholder="150.00"
                  aria-invalid={Boolean(
                    errors.reservePrice,
                  )}
                  className={`w-full rounded-xl border py-3 pl-8 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 ${
                    errors.reservePrice
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                      : 'border-gray-300 focus:border-gray-900 focus:ring-gray-100'
                  }`}
                />
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Must be equal to or higher than the
                starting price.
              </p>

              {errors.reservePrice && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.reservePrice}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section className="border-t border-gray-100 pt-8">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-gray-900">
              Auction Schedule
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Choose when your auction should start and
              end.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Start */}
            <div>
              <label
                htmlFor="scheduledStartAt"
                className="block text-sm font-medium text-gray-900"
              >
                Scheduled Start{' '}
                <span className="text-red-500">*</span>
              </label>

              <input
                id="scheduledStartAt"
                name="scheduledStartAt"
                type="datetime-local"
                value={form.scheduledStartAt}
                onChange={(event) =>
                  handleChange(
                    'scheduledStartAt',
                    event.target.value,
                  )
                }
                required
                aria-invalid={Boolean(
                  errors.scheduledStartAt,
                )}
                className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 ${
                  errors.scheduledStartAt
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-300 focus:border-gray-900 focus:ring-gray-100'
                }`}
              />

              {errors.scheduledStartAt && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.scheduledStartAt}
                </p>
              )}
            </div>

            {/* End */}
            <div>
              <label
                htmlFor="scheduledEndAt"
                className="block text-sm font-medium text-gray-900"
              >
                Scheduled End{' '}
                <span className="text-red-500">*</span>
              </label>

              <input
                id="scheduledEndAt"
                name="scheduledEndAt"
                type="datetime-local"
                value={form.scheduledEndAt}
                onChange={(event) =>
                  handleChange(
                    'scheduledEndAt',
                    event.target.value,
                  )
                }
                required
                aria-invalid={Boolean(
                  errors.scheduledEndAt,
                )}
                className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 ${
                  errors.scheduledEndAt
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-300 focus:border-gray-900 focus:ring-gray-100'
                }`}
              />

              {errors.scheduledEndAt && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.scheduledEndAt}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">
                Tip:
              </span>{' '}
              For your demo, use a start time about 1
              minute in the future and a short auction
              duration so you can observe the auction
              lifecycle.
            </p>
          </div>
        </section>

        {/* Error */}
        {submitError && (
          <div
            role="alert"
            className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600">
              !
            </div>

            <div>
              <p className="text-sm font-semibold text-red-800">
                Could not create listing
              </p>

              <p className="mt-1 text-sm text-red-700">
                {submitError}
              </p>
            </div>
          </div>
        )}

        {/* Success */}
        {successMessage && (
          <div
            role="status"
            className="flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
              ✓
            </div>

            <p className="text-sm font-medium text-green-800">
              {successMessage}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-xs text-gray-500">
          Fields marked with{' '}
          <span className="text-red-500">*</span> are
          required.
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Creating Listing...
            </>
          ) : (
            'Create Listing'
          )}
        </button>
      </div>
    </form>
  );
}