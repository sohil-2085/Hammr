import { z } from 'zod';

export const placeBidSchema = z.object({
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, 'Bid amount must be a valid monetary amount')
    .refine((value) => Number(value) > 0, {
      message: 'Bid amount must be greater than zero',
    }),
});

export type PlaceBidInput = z.infer<typeof placeBidSchema>;
