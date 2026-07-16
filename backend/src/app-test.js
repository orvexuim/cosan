import express from 'express';
import cookieParser from 'cookie-parser';
import authService from '../services/auth.service.js';
import productService from '../services/product.service.js';
import orderService from '../services/order.service.js';
import errorHandler from '../middlewares/errorHandler.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';

const app = express();
app.use(express.json());
app.use(cookieParser());

// Auth routes
app.post('/api/auth/register', async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.login(email, password);
    res.cookie('refreshToken', refreshToken, { httpOnly: true });
    res.status(200).json({ success: true, data: { user, accessToken } });
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const { resetToken } = await authService.forgotPassword(email);
    res.status(200).json({ success: true, message: 'Password reset link sent', token: resetToken });
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
});

app.get('/api/auth/me', requireAuth, async (req, res, next) => {
  res.status(200).json({ success: true, data: req.user });
});

// Products routes
app.get('/api/products', async (req, res, next) => {
  try {
    const result = await productService.getAll(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

app.get('/api/products/featured', async (req, res, next) => {
  try {
    const result = await productService.getAll({ isFeatured: 'true' });
    res.status(200).json({ success: true, data: result.products });
  } catch (err) {
    next(err);
  }
});

app.get('/api/products/search', async (req, res, next) => {
  try {
    const products = await productService.search(req.query.q);
    res.status(200).json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
});

app.get('/api/products/:slug', async (req, res, next) => {
  try {
    const product = await productService.getById(req.params.slug); // Using id/slug
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

app.post('/api/products', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const product = await productService.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

app.put('/api/products/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const product = await productService.update(req.params.id, req.body);
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/products/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await productService.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
});

// Orders routes
app.post('/api/orders', requireAuth, async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.user.id, req.body);
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

app.get('/api/orders', requireAuth, async (req, res, next) => {
  try {
    // Return mock my orders
    res.status(200).json({ success: true, data: [] });
  } catch (err) {
    next(err);
  }
});

app.get('/api/orders/all', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: [] });
  } catch (err) {
    next(err);
  }
});

app.get('/api/orders/:id', requireAuth, async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatus(req.params.id); // Read mock order
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

app.put('/api/orders/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder(req.user.id, req.params.id, req.user.role);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

app.put('/api/orders/:id/status', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

app.use(errorHandler);

export default app;
