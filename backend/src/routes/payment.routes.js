import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { createStripePaymentIntent, createPaypalOrder, capturePaypalPayment, stripeWebhook, refundPayment } from '../controllers/payment.controller.js';

const router = Router();

// Webhook routes (no auth, raw body)
router.post('/stripe/webhook', stripeWebhook);

// Authenticated routes
router.use(authenticate);
router.post('/stripe/intent', createStripePaymentIntent);
router.post('/paypal/create', createPaypalOrder);
router.post('/paypal/capture', capturePaypalPayment);
router.post('/refund', refundPayment);

export default router;
