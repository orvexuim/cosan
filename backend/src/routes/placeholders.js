import express from 'express';

const createRouter = (name) => {
  const router = express.Router();
  router.get('/', (req, res) => {
    res.json({ message: `Welcome to the COSMAN ${name} API router endpoint.` });
  });
  return router;
};

export const authRouter = createRouter('Auth');
export const usersRouter = createRouter('Users');
export const categoriesRouter = createRouter('Categories');
export const collectionsRouter = createRouter('Collections');
export const productsRouter = createRouter('Products');
export const cartRouter = createRouter('Cart');
export const wishlistRouter = createRouter('Wishlist');
export const ordersRouter = createRouter('Orders');
export const reviewsRouter = createRouter('Reviews');
export const couponsRouter = createRouter('Coupons');
export const adminRouter = createRouter('Admin');
export const analyticsRouter = createRouter('Analytics');
