import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  productQuerySchema
} from '../validators/product.validator.js';

const router = Router();

// Public Product routes
router.get('/', validate(productQuerySchema, 'query'), ProductController.getAll);
router.get('/featured', ProductController.getFeatured);
router.get('/search', ProductController.search);
router.get('/:slug', ProductController.getBySlug);
router.get('/:id/related', ProductController.getRelated);

// Admin Product & Variant routes
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createProductSchema),
  ProductController.create
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateProductSchema),
  ProductController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  ProductController.delete
);

// Nested Product Variants Management (Admin)
router.post(
  '/:id/variants',
  authenticate,
  authorize('ADMIN'),
  validate(createVariantSchema),
  ProductController.createVariant
);

router.put(
  '/:id/variants/:variantId',
  authenticate,
  authorize('ADMIN'),
  validate(updateVariantSchema),
  ProductController.updateVariant
);

router.delete(
  '/:id/variants/:variantId',
  authenticate,
  authorize('ADMIN'),
  ProductController.deleteVariant
);

export default router;
