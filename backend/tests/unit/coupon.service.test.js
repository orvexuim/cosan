import { jest } from '@jest/globals';
import couponService from '../../src/services/coupon.service.js';
import mockPrisma from '../helpers/mockDb.js';
import { mockCoupon } from '../helpers/mockData.js';
import ApiError from '../../src/utils/ApiError.js';

describe('CouponService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCoupon', () => {
    it('should validate a valid coupon successfully', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2);

      const coupon = mockCoupon({
        code: 'WELCOME10',
        isActive: true,
        validFrom: yesterday,
        validUntil: tomorrow,
        minAmount: 100.0,
        usageLimit: 50,
        usedCount: 10
      });

      mockPrisma.coupon.findUnique.mockSetValue(coupon);

      const result = await couponService.validateCoupon('WELCOME10', 150.0);
      expect(result.code).toBe('WELCOME10');
    });

    it('should throw ApiError if coupon code not found', async () => {
      mockPrisma.coupon.findUnique.mockSetValue(null);

      await expect(couponService.validateCoupon('NOTFOUND', 100.0))
        .rejects.toThrow(ApiError);
    });

    it('should throw ApiError if coupon is inactive', async () => {
      const coupon = mockCoupon({ isActive: false });
      mockPrisma.coupon.findUnique.mockSetValue(coupon);

      await expect(couponService.validateCoupon(coupon.code, 200.0))
        .rejects.toThrow(ApiError);
    });

    it('should throw ApiError if coupon is expired', async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);
      
      const coupon = mockCoupon({
        validUntil: expiredDate
      });
      mockPrisma.coupon.findUnique.mockSetValue(coupon);

      await expect(couponService.validateCoupon(coupon.code, 200.0))
        .rejects.toThrow(ApiError);
    });

    it('should throw ApiError if usage limit reached', async () => {
      const coupon = mockCoupon({
        usageLimit: 10,
        usedCount: 10
      });
      mockPrisma.coupon.findUnique.mockSetValue(coupon);

      await expect(couponService.validateCoupon(coupon.code, 200.0))
        .rejects.toThrow(ApiError);
    });

    it('should throw ApiError if minimum order amount is not met', async () => {
      const coupon = mockCoupon({
        minAmount: 500.0
      });
      mockPrisma.coupon.findUnique.mockSetValue(coupon);

      await expect(couponService.validateCoupon(coupon.code, 200.0))
        .rejects.toThrow(ApiError);
    });
  });

  describe('createCoupon', () => {
    it('should successfully create a coupon', async () => {
      const input = {
        code: 'spring20',
        type: 'PERCENTAGE',
        value: 20,
        minAmount: 50.0,
        validFrom: '2026-01-01',
        validUntil: '2026-12-31'
      };

      const created = mockCoupon({ ...input, code: 'SPRING20' });
      mockPrisma.coupon.create.mockSetValue(created);

      const result = await couponService.createCoupon(input);

      expect(mockPrisma.coupon.create).toHaveBeenCalled();
      expect(result.code).toBe('SPRING20');
    });
  });

  describe('updateCoupon', () => {
    it('should successfully update an existing coupon', async () => {
      const coupon = mockCoupon();
      mockPrisma.coupon.findUnique.mockSetValue(coupon);

      const updated = mockCoupon({ id: coupon.id, value: 15.0 });
      mockPrisma.coupon.update.mockSetValue(updated);

      const result = await couponService.updateCoupon(coupon.id, { value: 15.0 });

      expect(mockPrisma.coupon.update).toHaveBeenCalled();
      expect(result.value).toBe(15.0);
    });
  });
});
