import { z } from 'zod';

export const adminUpdateUserSchema = {
  body: z.object({
    role: z.enum(['CUSTOMER', 'ADMIN', 'MODERATOR'], {
      errorMap: () => ({ message: 'Invalid role' }),
    }).optional(),
    isActive: z.boolean().optional(),
  }),
};

export const adminQuerySchema = {
  query: z.object({
    search: z.string().trim().optional(),
    role: z.enum(['CUSTOMER', 'ADMIN', 'MODERATOR']).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
};

export const dashboardQuerySchema = {
  query: z.object({
    dateFrom: z.string().datetime({ message: 'Invalid dateFrom format (must be ISO-8601)' }).optional(),
    dateTo: z.string().datetime({ message: 'Invalid dateTo format (must be ISO-8601)' }).optional(),
    granularity: z.enum(['day', 'week', 'month'], {
      errorMap: () => ({ message: 'Granularity must be day, week, or month' }),
    }).optional().default('day'),
  }),
};
