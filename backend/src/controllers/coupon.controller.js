import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/ApiResponse.js';
import couponService from '../services/coupon.service.js';

export const validateCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const { subtotal } = req.body;
  const coupon = await couponService.validateCoupon(code, subtotal);
  return successResponse(res, { data: coupon, message: 'Coupon is valid' });
});

export const applyCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  const result = await couponService.applyCoupon(code, subtotal);
  return successResponse(res, { data: result, message: 'Coupon applied' });
});

export const getAllCoupons = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const coupons = await couponService.getAllCoupons(parseInt(page), parseInt(limit));
  return successResponse(res, { data: coupons, message: 'Coupons retrieved' });
});

export const getCouponByCode = asyncHandler(async (req, res) => {
  const coupon = await couponService.getCouponByCode(req.params.code);
  return successResponse(res, { data: coupon, message: 'Coupon retrieved' });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.createCoupon(req.body);
  return successResponse(res, { data: coupon, message: 'Coupon created', statusCode: 201 });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.updateCoupon(req.params.id, req.body);
  return successResponse(res, { data: coupon, message: 'Coupon updated' });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  await couponService.deleteCoupon(req.params.id);
  return successResponse(res, { message: 'Coupon deleted' });
});
