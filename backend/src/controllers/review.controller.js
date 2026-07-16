import { ReviewService } from '../services/review.service.js';
import { successResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePagination, formatPaginatedResponse } from '../utils/pagination.js';

export const ReviewController = {
  /**
   * @swagger
   * /reviews/product/{productId}:
   *   get:
   *     summary: Get reviews for a product
   *     tags: [Reviews]
   */
  getReviews: asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const { reviews, total } = await ReviewService.getReviews(req.params.productId, pagination);
    return res.status(200).json(
      successResponse(
        formatPaginatedResponse(reviews, total, pagination.page, pagination.limit),
        'Product reviews retrieved successfully'
      )
    );
  }),

  /**
   * @swagger
   * /reviews/product/{productId}:
   *   post:
   *     summary: Create review for a product (Authenticated)
   *     tags: [Reviews]
   */
  createReview: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const review = await ReviewService.createReview(userId, req.params.productId, req.body);
    return res.status(201).json(successResponse(review, 'Review created successfully'));
  }),

  /**
   * @swagger
   * /reviews/{id}:
   *   put:
   *     summary: Update review (Authenticated, Owner only)
   *     tags: [Reviews]
   */
  updateReview: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const review = await ReviewService.updateReview(userId, req.params.id, req.body);
    return res.status(200).json(successResponse(review, 'Review updated successfully'));
  }),

  /**
   * @swagger
   * /reviews/{id}:
   *   delete:
   *     summary: Delete review (Authenticated, Owner/Admin only)
   *     tags: [Reviews]
   */
  deleteReview: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const result = await ReviewService.deleteReview(userId, userRole, req.params.id);
    return res.status(200).json(successResponse(null, result.message));
  })
};
