import { Router } from 'express';
import { CollectionController } from '../controllers/collection.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createCollectionSchema, updateCollectionSchema } from '../validators/product.validator.js';

const router = Router();

// Public routes
router.get('/', CollectionController.getAll);
router.get('/:slug', CollectionController.getBySlug);
router.get('/id/:id', CollectionController.getById);
router.get('/:slug/products', CollectionController.getProducts);

// Admin routes
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createCollectionSchema),
  CollectionController.create
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateCollectionSchema),
  CollectionController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  CollectionController.delete
);

export default router;
