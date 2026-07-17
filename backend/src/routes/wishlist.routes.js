import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getWishlist, add, remove, moveToCart, clear } from '../controllers/wishlist.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', getWishlist);
router.post('/:productId', add);
router.delete('/:productId', remove);
router.post('/:productId/move-to-cart', moveToCart);
router.delete('/', clear);

export default router;
