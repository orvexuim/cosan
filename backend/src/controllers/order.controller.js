import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/ApiResponse.js';
import orderService from '../services/order.service.js';
import { ApiError } from '../utils/ApiError.js';

export const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user.id, req.body);
  return successResponse(res, { data: order, message: 'Order created successfully', statusCode: 201 });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const orders = await orderService.getMyOrders(req.user.id, { page: parseInt(page), limit: parseInt(limit), status });
  return successResponse(res, { data: orders, message: 'Your orders retrieved' });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id, req.user.id, req.user.role);
  return successResponse(res, { data: order, message: 'Order retrieved' });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.user.id, req.params.id, req.user.role);
  return successResponse(res, { data: order, message: 'Order cancelled' });
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, paymentStatus, dateFrom, dateTo } = req.query;
  const orders = await orderService.getAllOrders({ page: parseInt(page), limit: parseInt(limit), status, paymentStatus, dateFrom, dateTo });
  return successResponse(res, { data: orders, message: 'All orders retrieved' });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await orderService.updateOrderStatus(req.params.id, status);
  return successResponse(res, { data: order, message: 'Order status updated' });
});

export const updateTracking = asyncHandler(async (req, res) => {
  const { trackingNumber, carrier } = req.body;
  const order = await orderService.updateTracking(req.params.id, trackingNumber, carrier);
  return successResponse(res, { data: order, message: 'Tracking info updated' });
});
