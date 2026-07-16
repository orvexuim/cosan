import { z } from 'zod';

// Product query validation
export const productQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  collectionId: z.string().uuid().optional(),
  minPrice: z.preprocess((val) => (val ? parseFloat(val) : undefined), z.number().min(0)).optional(),
  maxPrice: z.preprocess((val) => (val ? parseFloat(val) : undefined), z.number().min(0)).optional(),
  sizes: z.preprocess((val) => {
    if (typeof val === 'string') return val.split(',');
    return val;
  }, z.array(z.string())).optional(),
  colors: z.preprocess((val) => {
    if (typeof val === 'string') return val.split(',');
    return val;
  }, z.array(z.string())).optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'newest', 'rating', 'popular']).optional(),
  page: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().int().min(1)).optional(),
  limit: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().int().min(1)).optional(),
});

// Category Schemas
export const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2).optional(),
  description: z.string().optional(),
  image: z.string().url('Image must be a valid URL').optional().or(z.literal('')),
  parentId: z.string().uuid('Parent ID must be a valid UUID').nullable().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// Collection Schemas
export const createCollectionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2).optional(),
  description: z.string().optional(),
  image: z.string().url('Image must be a valid URL').optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

export const updateCollectionSchema = createCollectionSchema.partial();

// Product Variant Schemas
export const createVariantSchema = z.object({
  size: z.string().min(1, 'Size is required'),
  color: z.string().min(1, 'Color is required'),
  colorHex: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color starting with #').optional().default('#000000'),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  stock: z.number().int().nonnegative('Stock cannot be negative'),
  priceAdjustment: z.number().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateVariantSchema = createVariantSchema.partial();

// Product Schemas
export const createProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be greater than 0'),
  compareAtPrice: z.number().positive('Compare-at price must be greater than 0').optional().nullable(),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  categoryId: z.string().uuid('Category ID must be a valid UUID').optional().nullable(),
  brand: z.string().optional().default('COSMAN'),
  mainImage: z.string().url('Main image must be a valid URL'),
  images: z.array(z.string().url('Each image must be a valid URL')).nonempty('At least one additional image is required'),
  tags: z.array(z.string()).optional().default([]),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  collections: z.array(z.string().uuid()).optional().default([]), // Collection IDs to associate
  variants: z.array(createVariantSchema).nonempty('At least one variant is required'),
});

export const updateProductSchema = createProductSchema.partial().extend({
  // Allow variants and collections to be optional or omitted in updates (managed via separate endpoints or nested)
  variants: z.array(createVariantSchema).optional(),
  collections: z.array(z.string().uuid()).optional(),
});

// Review Schemas
export const createReviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot be more than 5'),
  title: z.string().max(100, 'Title cannot exceed 100 characters').optional().nullable(),
  comment: z.string().min(5, 'Comment must be at least 5 characters'),
});

export const updateReviewSchema = createReviewSchema.partial();
