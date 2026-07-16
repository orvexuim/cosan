import { prisma } from '../config/database.js';

export const couponRepository = {
  /**
   * Find coupon by its unique code
   */
  async findByCode(code) {
    return prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
  },

  /**
   * Find coupon by ID
   */
  async findById(id) {
    return prisma.coupon.findUnique({
      where: { id },
    });
  },

  /**
   * List all coupons with optional pagination
   */
  async findAll(skip = 0, limit = 50) {
    const [items, total] = await prisma.$transaction([
      prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.coupon.count(),
    ]);

    return { items, total };
  },

  /**
   * Create a new coupon
   */
  async create(couponData) {
    return prisma.coupon.create({
      data: {
        ...couponData,
        code: couponData.code.toUpperCase(),
      },
    });
  },

  /**
   * Update an existing coupon
   */
  async update(id, couponData) {
    return prisma.coupon.update({
      where: { id },
      data: {
        ...couponData,
        code: couponData.code ? couponData.code.toUpperCase() : undefined,
      },
    });
  },

  /**
   * Delete coupon
   */
  async delete(id) {
    return prisma.coupon.delete({
      where: { id },
    });
  },

  /**
   * Increment coupon used count
   */
  async incrementUsage(id, tx = prisma) {
    return tx.coupon.update({
      where: { id },
      data: {
        usedCount: {
          increment: 1,
        },
      },
    });
  },

  /**
   * Check if a coupon is valid for a given subtotal
   */
  async isValid(code, subtotal) {
    const coupon = await this.findByCode(code);
    if (!coupon) return { valid: false, message: 'Coupon not found' };

    const now = new Date();

    if (!coupon.isActive) {
      return { valid: false, message: 'Coupon is inactive' };
    }

    if (now < new Date(coupon.validFrom)) {
      return { valid: false, message: 'Coupon has not started yet' };
    }

    if (coupon.validUntil && now > new Date(coupon.validUntil)) {
      return { valid: false, message: 'Coupon has expired' };
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, message: 'Coupon usage limit reached' };
    }

    if (subtotal < coupon.minAmount) {
      return {
        valid: false,
        message: `Minimum order amount of $${coupon.minAmount} is required for this coupon`,
      };
    }

    return { valid: true, coupon };
  },
};

export default couponRepository;
