import { z } from 'zod';

export const createOrderSchema = {
  body: z.object({
    items: z.array(
      z.object({
        productId: z.string().uuid('Invalid product ID format'),
        productVariantId: z.string().uuid('Invalid variant ID format').optional(),
        quantity: z.number().int('Quantity must be an integer').min(1, 'Quantity must be at least 1'),
      })
    ).min(1, 'Order must contain at least one item'),
    shippingAddressId: z.string().uuid('Invalid shipping address ID format'),
    paymentMethod: z.enum(['STRIPE', 'PAYPAL', 'CASH_ON_DELIVERY'], {
      errorMap: () => ({ message: 'Payment method must be STRIPE, PAYPAL, or CASH_ON_DELIVERY' }),
    }),
    couponCode: z.string().trim().toUpperCase().optional(),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  }),
};

export const updateOrderStatusSchema = {
  body: z.object({
    status: z.enum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'], {
      errorMap: () => ({ message: 'Invalid order status' }),
    }),
    trackingNumber: z.string().trim().optional(),
    carrier: z.string().trim().optional(),
  }),
};

export const orderQuerySchema = {
  query: z.object({
    status: z.enum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
    paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
    dateFrom: z.string().datetime({ message: 'Invalid dateFrom format (must be ISO-8601)' }).optional(),
    dateTo: z.string().datetime({ message: 'Invalid dateTo format (must be ISO-8601)' }).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
};
