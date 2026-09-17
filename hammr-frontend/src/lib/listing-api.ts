import type { CreateListingInput } from '@/types/listing';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const createListing = async (input: CreateListingInput, accessToken: string) => {
  if (!API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured.');
  }

  const response = await fetch(`${API_URL}/listings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let message = 'Failed to create listing.';

    try {
      const data = (await response.json()) as {
        error?: {
          message?: string;
        };
      };

      if (data.error?.message) {
        message = data.error.message;
      }
    } catch {
      // Keep the default message if the response is not valid JSON.
    }

    throw new Error(message);
  }

  return response.json();
};
