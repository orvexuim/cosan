import Stripe from 'stripe';
import { prisma } from '../config/database.js';
import { orderRepository } from '../repositories/order.repository.js';
import { orderService } from './order.service.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import config from '../config/env.js';

// Initialize Stripe (fallback dummy key for build checks if env is missing)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2023-10-16',
});

export const paymentService = {
  /**
   * Stripe: Create Payment Intent
   */
  async createStripePaymentIntent(orderId, userId) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (order.userId !== userId) {
      throw new ApiError(403, 'Unauthorized to pay for this order');
    }

    if (order.paymentStatus === 'PAID') {
      throw new ApiError(400, 'Order is already paid');
    }

    // Stripe expects amount in cents
    const amountInCents = Math.round(order.totalAmount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        orderId,
        orderNumber: order.orderNumber,
        userId,
      },
    });

    // Update order with Stripe Payment Intent ID
    await prisma.order.update({
      where: { id: orderId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  },

  /**
   * Stripe: Confirm payment intent status
   */
  async confirmStripePayment(paymentIntentId) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const orderId = paymentIntent.metadata.orderId;
      await orderService.updatePaymentStatus(orderId, 'PAID');
      return { success: true, message: 'Payment confirmed successfully' };
    }

    return { success: false, status: paymentIntent.status };
  },

  /**
   * Stripe: Webhook event processing
   */
  async handleStripeWebhook(rawBody, signature) {
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy'
      );
    } catch (err) {
      logger.error('Stripe webhook verification failed:', err);
      throw new ApiError(400, `Webhook Error: ${err.message}`);
    }

    logger.info(`Stripe Webhook received: ${event.type}`);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;
      await orderService.updatePaymentStatus(orderId, 'PAID');
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;
      await orderService.updatePaymentStatus(orderId, 'FAILED');
    }

    return { received: true };
  },

  /**
   * PayPal: Mock Create PayPal Order
   */
  async createPaypalOrder(orderId, userId) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (order.userId !== userId) {
      throw new ApiError(403, 'Unauthorized to pay for this order');
    }

    // Generates a mock PayPal order ID (or call PayPal API directly in production)
    const paypalOrderId = `PP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paypalOrderId,
      },
    });

    return {
      paypalOrderId,
      orderId,
      totalAmount: order.totalAmount,
    };
  },

  /**
   * PayPal: Capture payment details
   */
  async capturePaypalOrder(paypalOrderId) {
    const order = await prisma.order.findFirst({
      where: { paypalOrderId },
    });

    if (!order) {
      throw new ApiError(404, 'Order with PayPal Order ID not found');
    }

    // In a real implementation, you would trigger capture on PayPal servers here
    await orderService.updatePaymentStatus(order.id, 'PAID');

    return {
      success: true,
      message: 'PayPal payment captured successfully',
      orderId: order.id,
    };
  },

  /**
   * Refund Payment
   */
  async refundPayment(orderId) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (order.paymentStatus !== 'PAID') {
      throw new ApiError(400, 'Cannot refund an unpaid order');
    }

    if (order.paymentMethod === 'STRIPE' && order.stripePaymentIntentId) {
      await stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
      });
    }

    // Update DB state
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'REFUNDED',
        status: 'REFUNDED',
      },
    });

    return { success: true, message: 'Refund processed successfully' };
  },
};

export default paymentService;
