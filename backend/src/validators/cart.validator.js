import { z } from 'zod';

export const addItemSchema = {
  body: z.object({
    productId: z.string().uuid('Invalid product ID format'),
    productVariantId: z.string().uuid('Invalid variant ID format').optional(),
    quantity: z.number().int('Quantity must be an integer').min(1, 'Quantity must be at least 1'),
  }),
};

export const updateItemSchema = {
  body: z.object({
    quantity: z.number().int('Quantity must be an integer').min(1, 'Quantity must be at least 1'),
  }),
};

export const applyCouponSchema = {
  body: z.object({
    code: z.string().min(1, 'Coupon code cannot be empty').trim().toUpperCase(),
  }),
};
