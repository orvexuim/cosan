import { z } from 'zod';

export const createCouponSchema = {
  body: z.object({
    code: z.string().min(1, 'Coupon code cannot be empty').trim().toUpperCase(),
    type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT'], {
      errorMap: () => ({ message: 'Coupon type must be PERCENTAGE or FIXED_AMOUNT' }),
    }),
    value: z.number().positive('Coupon value must be greater than 0'),
    minAmount: z.number().nonnegative('Minimum amount cannot be negative').optional().default(0),
    maxDiscount: z.number().positive('Max discount must be greater than 0').optional(),
    usageLimit: z.number().int().positive('Usage limit must be a positive integer').optional(),
    validFrom: z.string().datetime({ message: 'validFrom must be a valid ISO-8601 string' }).transform((val) => new Date(val)),
    validUntil: z.string().datetime({ message: 'validUntil must be a valid ISO-8601 string' }).transform((val) => new Date(val)),
    isActive: z.boolean().optional().default(true),
  }),
};

export const updateCouponSchema = {
  body: z.object({
    code: z.string().min(1, 'Coupon code cannot be empty').trim().toUpperCase().optional(),
    type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
    value: z.number().positive('Coupon value must be greater than 0').optional(),
    minAmount: z.number().nonnegative('Minimum amount cannot be negative').optional(),
    maxDiscount: z.number().positive('Max discount must be greater than 0').optional(),
    usageLimit: z.number().int().positive('Usage limit must be a positive integer').optional(),
    validFrom: z.string().datetime().transform((val) => new Date(val)).optional(),
    validUntil: z.string().datetime().transform((val) => new Date(val)).optional(),
    isActive: z.boolean().optional(),
  }),
};

export const validateCouponSchema = {
  body: z.object({
    code: z.string().min(1, 'Coupon code is required').trim().toUpperCase(),
    subtotal: z.number().nonnegative('Subtotal cannot be negative'),
  }),
};
