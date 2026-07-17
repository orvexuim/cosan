import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createCouponSchema, updateCouponSchema, validateCouponSchema } from '../validators/coupon.validator.js';
import { validateCoupon, getAllCoupons, getCouponByCode, createCoupon, updateCoupon, deleteCoupon } from '../controllers/coupon.controller.js';

const router = Router();

// Public
router.post('/validate', validate(validateCouponSchema), validateCoupon);

// Admin
router.use(authenticate, authorize('ADMIN'));
router.get('/', getAllCoupons);
router.get('/:code', getCouponByCode);
router.post('/', validate(createCouponSchema), createCoupon);
router.put('/:id', validate(updateCouponSchema), updateCoupon);
router.delete('/:id', deleteCoupon);

export default router;
