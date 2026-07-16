import { prisma } from '../config/database.js';

export const ReviewRepository = {
  /**
   * Find reviews by product ID with paginated user details.
   */
  async findByProductId(productId, pagination = { skip: 0, take: 10 }) {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      }),
      prisma.review.count({ where: { productId } })
    ]);

    return { reviews, total };
  },

  /**
   * Find review by ID.
   */
  async findById(id) {
    return prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });
  },

  /**
   * Create a review.
   */
  async create(data) {
    return prisma.review.create({
      data,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });
  },

  /**
   * Update a review.
   */
  async update(id, data) {
    return prisma.review.update({
      where: { id },
      data,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });
  },

  /**
   * Delete a review.
   */
  async delete(id) {
    return prisma.review.delete({
      where: { id }
    });
  },

  /**
   * Find review by User ID and Product ID to prevent duplicate reviews.
   */
  async findByUserAndProduct(userId, productId) {
    return prisma.review.findFirst({
      where: { userId, productId }
    });
  },

  /**
   * Check if a user has a verified purchase of a product by checking completed orders containing it.
   */
  async checkVerifiedPurchase(userId, productId) {
    const count = await prisma.order.count({
      where: {
        userId,
        status: 'DELIVERED',
        items: {
          some: {
            productId
          }
        }
      }
    });
    return count > 0;
  },

  /**
   * Calculates the average rating and total review count of a product.
   */
  async calculateAverageRating(productId) {
    const aggregate = await prisma.review.aggregate({
      where: { productId },
      _avg: {
        rating: true
      },
      _count: {
        id: true
      }
    });

    return {
      averageRating: parseFloat((aggregate._avg.rating || 0).toFixed(1)),
      reviewCount: aggregate._count.id || 0
    };
  }
};
