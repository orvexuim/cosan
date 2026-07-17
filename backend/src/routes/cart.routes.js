import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { addItemSchema, updateItemSchema, applyCouponSchema } from '../validators/cart.validator.js';
import { getCart, addItem, updateItem, removeItem, clearCart, applyCoupon } from '../controllers/cart.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/items', validate(addItemSchema), addItem);
router.put('/items/:id', validate(updateItemSchema), updateItem);
router.delete('/items/:id', removeItem);
router.delete('/', clearCart);
router.post('/coupon', validate(applyCouponSchema), applyCoupon);

export default router;
