import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createReviewSchema, updateReviewSchema } from '../validators/product.validator.js';

const router = Router();

// Public routes
router.get('/product/:productId', ReviewController.getReviews);

// Authenticated customer routes
router.post(
  '/product/:productId',
  authenticate,
  validate(createReviewSchema),
  ReviewController.createReview
);

router.put(
  '/:id',
  authenticate,
  validate(updateReviewSchema),
  ReviewController.updateReview
);

router.delete(
  '/:id',
  authenticate,
  ReviewController.deleteReview
);

export default router;
