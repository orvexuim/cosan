import { couponRepository } from '../repositories/coupon.repository.js';
import { ApiError } from '../utils/ApiError.js';

export const couponService = {
  /**
   * Validate Coupon
   */
  async validateCoupon(code, subtotal) {
    const result = await couponRepository.isValid(code, subtotal);
    if (!result.valid) {
      throw new ApiError(400, result.message);
    }
    return result.coupon;
  },

  /**
   * Calculate Discount Value
   */
  async applyCoupon(code, subtotal) {
    const coupon = await this.validateCoupon(code, subtotal);
    
    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.type === 'FIXED_AMOUNT') {
      discount = coupon.value;
    }

    if (discount > subtotal) {
      discount = subtotal;
    }

    return {
      coupon,
      discount,
      newSubtotal: subtotal - discount,
    };
  },

  /**
   * Admin: Create Coupon
   */
  async createCoupon(data) {
    const existing = await couponRepository.findByCode(data.code);
    if (existing) {
      throw new ApiError(400, 'A coupon with this code already exists');
    }

    return couponRepository.create(data);
  },

  /**
   * Admin: Update Coupon
   */
  async updateCoupon(id, data) {
    const existing = await couponRepository.findById(id);
    if (!existing) {
      throw new ApiError(404, 'Coupon not found');
    }

    if (data.code && data.code.toUpperCase() !== existing.code) {
      const codeDuplicate = await couponRepository.findByCode(data.code);
      if (codeDuplicate) {
        throw new ApiError(400, 'A coupon with this code already exists');
      }
    }

    return couponRepository.update(id, data);
  },

  /**
   * Admin: Delete Coupon
   */
  async deleteCoupon(id) {
    const existing = await couponRepository.findById(id);
    if (!existing) {
      throw new ApiError(404, 'Coupon not found');
    }

    await couponRepository.delete(id);
    return { success: true, message: 'Coupon deleted successfully' };
  },

  /**
   * Admin: Get all coupons
   */
  async getAllCoupons(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    return couponRepository.findAll(skip, limit);
  },

  /**
   * Get coupon by its unique code
   */
  async getCouponByCode(code) {
    const coupon = await couponRepository.findByCode(code);
    if (!coupon) {
      throw new ApiError(404, 'Coupon not found');
    }
    return coupon;
  },
};

export default couponService;
