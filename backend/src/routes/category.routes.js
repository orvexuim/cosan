import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createCategorySchema, updateCategorySchema } from '../validators/product.validator.js';

const router = Router();

// Public routes
router.get('/', CategoryController.getAll);
router.get('/tree', CategoryController.getTree);
router.get('/:slug', CategoryController.getBySlug);
router.get('/id/:id', CategoryController.getById);

// Admin routes
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createCategorySchema),
  CategoryController.create
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateCategorySchema),
  CategoryController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  CategoryController.delete
);

export default router;
