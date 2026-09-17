import { z } from 'zod';

const decimalString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid amount with up to 2 decimal places.')
  .refine((value) => Number(value) > 0, 'Must be greater than 0.');

export const createListingSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required.')
      .max(200, 'Title must be 200 characters or less.'),

    description: z
      .string()
      .trim()
      .min(1, 'Description is required.')
      .max(5000, 'Description must be 5000 characters or less.'),

    images: z
      .array(z.string().trim().url('Each image must be a valid URL.'))
      .min(1, 'At least one image is required.'),

    category: z
      .string()
      .trim()
      .min(1, 'Category is required.')
      .max(100, 'Category must be 100 characters or less.'),

    startingPrice: decimalString,

    reservePrice: decimalString.optional(),

    scheduledStartAt: z.coerce.date({
      error: 'Scheduled start time must be a valid date.',
    }),

    scheduledEndAt: z.coerce.date({
      error: 'Scheduled end time must be a valid date.',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.reservePrice !== undefined) {
      if (Number(data.reservePrice) < Number(data.startingPrice)) {
        ctx.addIssue({
          code: 'custom',
          path: ['reservePrice'],
          message: 'Reserve price cannot be lower than the starting price.',
        });
      }
    }

    if (data.scheduledEndAt <= data.scheduledStartAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['scheduledEndAt'],
        message: 'Scheduled end time must be after the scheduled start time.',
      });
    }
  });

export type CreateListingInput = z.infer<typeof createListingSchema>;