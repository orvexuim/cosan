import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import {
  getAllUsers, getUserById, updateUserRole, toggleUserActive,
  getDashboardStats, getSalesAnalytics, getTopProducts, getTopCustomers,
  getOrderStats, getRevenueByPaymentMethod
} from '../controllers/admin.controller.js';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/role', updateUserRole);
router.patch('/users/:id/active', toggleUserActive);
router.get('/dashboard/stats', getDashboardStats);
router.get('/analytics/sales', getSalesAnalytics);
router.get('/analytics/top-products', getTopProducts);
router.get('/analytics/top-customers', getTopCustomers);
router.get('/analytics/order-stats', getOrderStats);
router.get('/analytics/revenue-by-payment', getRevenueByPaymentMethod);

export default router;
