import { ReviewRepository } from '../repositories/review.repository.js';
import { ProductRepository } from '../repositories/product.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { ProductService } from './product.service.js';

export const ReviewService = {
  /**
   * Get paginated reviews for a product.
   */
  async getReviews(productId, pagination) {
    const product = await ProductRepository.findById(productId);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    return ReviewRepository.findByProductId(productId, pagination);
  },

  /**
   * Create a review for a product.
   */
  async createReview(userId, productId, data) {
    const product = await ProductRepository.findById(productId);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    // Check duplicate review
    const duplicate = await ReviewRepository.findByUserAndProduct(userId, productId);
    if (duplicate) {
      throw new ApiError(400, 'You have already reviewed this product. Please edit your existing review instead.');
    }

    // Check if verified purchase
    const isVerifiedPurchase = await ReviewRepository.checkVerifiedPurchase(userId, productId);

    const review = await ReviewRepository.create({
      ...data,
      userId,
      productId,
      isVerifiedPurchase
    });

    // Recalculate average rating
    await this.updateProductRating(productId);

    return review;
  },

  /**
   * Update an existing review (owner only).
   */
  async updateReview(userId, id, data) {
    const review = await ReviewRepository.findById(id);
    if (!review) {
      throw new ApiError(404, 'Review not found');
    }

    if (review.userId !== userId) {
      throw new ApiError(403, 'You are not authorized to update this review');
    }

    const updatedReview = await ReviewRepository.update(id, data);

    // Recalculate product rating
    await this.updateProductRating(review.productId);

    return updatedReview;
  },

  /**
   * Delete a review (owner or admin).
   */
  async deleteReview(userId, userRole, id) {
    const review = await ReviewRepository.findById(id);
    if (!review) {
      throw new ApiError(404, 'Review not found');
    }

    if (review.userId !== userId && userRole !== 'ADMIN') {
      throw new ApiError(403, 'You are not authorized to delete this review');
    }

    await ReviewRepository.delete(id);

    // Recalculate product rating
    await this.updateProductRating(review.productId);

    return { message: 'Review deleted successfully' };
  },

  /**
   * Recalculate average rating and review counts and update the product model.
   */
  async updateProductRating(productId) {
    const { averageRating, reviewCount } = await ReviewRepository.calculateAverageRating(productId);
    await ProductRepository.updateRating(productId, averageRating, reviewCount);
    
    // Invalidate product cache
    await ProductService.invalidateCache(productId);
  }
};
