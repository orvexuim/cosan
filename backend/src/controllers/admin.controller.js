import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/ApiResponse.js';
import adminService from '../services/admin.service.js';

export const getAllUsers = asyncHandler(async (req, res) => {
  const { search, role, page = 1, limit = 10 } = req.query;
  const result = await adminService.getAllUsers({ search, role, page: parseInt(page), limit: parseInt(limit) });
  return successResponse(res, { data: result, message: 'Users retrieved' });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await adminService.getUserById(req.params.id);
  return successResponse(res, { data: user, message: 'User retrieved' });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const user = await adminService.updateUserRole(req.params.id, role);
  return successResponse(res, { data: user, message: 'User role updated' });
});

export const toggleUserActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await adminService.toggleUserActive(req.params.id, isActive);
  return successResponse(res, { data: user, message: 'User status updated' });
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  const stats = await adminService.getDashboardStats({ dateFrom, dateTo });
  return successResponse(res, { data: stats, message: 'Dashboard stats retrieved' });
});

export const getSalesAnalytics = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, granularity } = req.query;
  const analytics = await adminService.getSalesAnalytics({ dateFrom, dateTo, granularity });
  return successResponse(res, { data: analytics, message: 'Sales analytics retrieved' });
});

export const getTopProducts = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const products = await adminService.getTopProducts(parseInt(limit));
  return successResponse(res, { data: products, message: 'Top products retrieved' });
});

export const getTopCustomers = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const customers = await adminService.getTopCustomers(parseInt(limit));
  return successResponse(res, { data: customers, message: 'Top customers retrieved' });
});

export const getOrderStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getOrderStats();
  return successResponse(res, { data: stats, message: 'Order stats retrieved' });
});

export const getRevenueByPaymentMethod = asyncHandler(async (req, res) => {
  const stats = await adminService.getRevenueByPaymentMethod();
  return successResponse(res, { data: stats, message: 'Revenue by payment method retrieved' });
});
