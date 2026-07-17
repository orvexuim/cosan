import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createOrderSchema, updateOrderStatusSchema } from '../validators/order.validator.js';
import { createOrder, getMyOrders, getOrderById, cancelOrder, getAllOrders, updateOrderStatus, updateTracking } from '../controllers/order.controller.js';

const router = Router();

router.use(authenticate);

// Customer routes
router.post('/', validate(createOrderSchema), createOrder);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);

// Admin routes
router.get('/all', authorize('ADMIN'), getAllOrders);
router.put('/:id/status', authorize('ADMIN'), validate(updateOrderStatusSchema), updateOrderStatus);
router.put('/:id/tracking', authorize('ADMIN'), updateTracking);

export default router;
