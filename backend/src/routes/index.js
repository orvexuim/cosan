import express from 'express';

// Try loading real modules, fall back safely to placeholders
let auth, users, categories, collections, products, cart, wishlist, orders, reviews, coupons, admin, analytics;

try {
  const mod = await import('./auth.js');
  auth = mod.default;
} catch {
  const mod = await import('./placeholders.js');
  auth = mod.authRouter;
}

try {
  const mod = await import('./users.js');
  users = mod.default;
} catch {
  const mod = await import('./placeholders.js');
  users = mod.usersRouter;
}

try {
  const mod = await import('./categories.js');
  categories = mod.default;
} catch {
  const mod = await import('./placeholders.js');
  categories = mod.categoriesRouter;
}

try {
  const mod = await import('./collections.js');
  collections = mod.default;
} catch {
  const mod = await import('./placeholders.js');
  collections = mod.collectionsRouter;
}

try {
  const mod = await import('./products.js');
  products = mod.default;
} catch {
  const mod = await import('./placeholders.js');
  products = mod.productsRouter;
}

try {
  const mod = await import('./cart.js');
  cart = mod.default;
} catch {
  const mod = await import('./placeholders.js');
  cart = mod.cartRouter;
}

try {
  const mod = await import('./wishlist.js');
  wishlist = mod.default;
} catch {
  const mod = await import('./placeholders.js');
  wishlist = mod.wishlistRouter;
}

try {
  const mod = await import('./orders.js');
  orders = mod.default;
} catch {
  const mod = await import('./placeholders.js');
  orders = mod.ordersRouter;
}

try {
  const mod = await import('./reviews.js');
  reviews = mod.default;
} catch {
  const mod = await import('./placeholders.js');
  reviews = mod.reviewsRouter;
}

try {
  const mod = await import('./coupons.js');
  coupons = mod.default;
} catch {
  const mod = await import('./placeholders.js');
  coupons = mod.couponsRouter;
}

try {
  const mod = await import('./admin.js');
  admin = mod.default;
} catch {
  const mod = await import('./placeholders.js');
  admin = mod.adminRouter;
}

try {
  const mod = await import('./analytics.js');
  analytics = mod.default;
} catch {
  const mod = await import('./placeholders.js');
  analytics = mod.analyticsRouter;
}

const router = express.Router();

router.use('/auth', auth);
router.use('/users', users);
router.use('/categories', categories);
router.use('/collections', collections);
router.use('/products', products);
router.use('/cart', cart);
router.use('/wishlist', wishlist);
router.use('/orders', orders);
router.use('/reviews', reviews);
router.use('/coupons', coupons);
router.use('/admin', admin);
router.use('/analytics', analytics);

export default router;
