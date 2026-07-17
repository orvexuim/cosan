import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/ApiResponse.js';
import paymentService from '../services/payment.service.js';
import { ApiError } from '../utils/ApiError.js';

export const createStripePaymentIntent = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const intent = await paymentService.createStripePaymentIntent(orderId, req.user.id);
  return successResponse(res, { data: intent, message: 'Payment intent created' });
});

export const createPaypalOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const paypalOrder = await paymentService.createPaypalOrder(orderId, req.user.id);
  return successResponse(res, { data: paypalOrder, message: 'PayPal order created' });
});

export const capturePaypalPayment = asyncHandler(async (req, res) => {
  const { orderId, paypalOrderId } = req.body;
  const result = await paymentService.capturePaypalOrder(orderId, paypalOrderId, req.user.id);
  return successResponse(res, { data: result, message: 'PayPal payment captured' });
});

export const stripeWebhook = asyncHandler(async (req, res) => {
  const event = req.body;
  await paymentService.handleStripeWebhook(event);
  return res.status(200).json({ received: true });
});

export const refundPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const result = await paymentService.refundPayment(orderId);
  return successResponse(res, { data: result, message: 'Payment refunded' });
});
