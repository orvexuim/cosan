import { wishlistRepository } from '../repositories/wishlist.repository.js';
import { cartRepository } from '../repositories/cart.repository.js';
import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { cache } from '../config/redis.js';

export const wishlistService = {
  /**
   * Get user's wishlist details
   */
  async getWishlist(userId) {
    const items = await wishlistRepository.findByUserId(userId);
    return items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productSlug: item.product.slug,
      productPrice: item.product.price,
      productImage: item.product.mainImage,
      isActive: item.product.isActive,
      variants: item.product.variants,
    }));
  },

  /**
   * Add a product to the user's wishlist
   */
  async addToWishlist(userId, productId) {
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      throw new ApiError(404, 'Product not found or is inactive');
    }

    return wishlistRepository.addItem(userId, productId);
  },

  /**
   * Remove a product from the user's wishlist
   */
  async removeFromWishlist(userId, productId) {
    const existing = await wishlistRepository.findByUserIdAndProductId(userId, productId);
    if (!existing) {
      throw new ApiError(404, 'Product is not in your wishlist');
    }

    await wishlistRepository.removeItem(userId, productId);
    return { success: true, message: 'Product removed from wishlist' };
  },

  /**
   * Move item from wishlist to cart
   */
  async moveToCart(userId, productId, productVariantId = null) {
    // 1. Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      throw new ApiError(404, 'Product is inactive or does not exist');
    }

    // 2. Verify stock if variant is supplied
    if (productVariantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: productVariantId },
      });
      if (!variant || variant.stock < 1) {
        throw new ApiError(400, 'Product variant is out of stock');
      }
    }

    // 3. Complete transfer
    await wishlistRepository.moveToCart(userId, productId, productVariantId);

    // 4. Invalidate Cart Cache
    await cache.del(`cart:${userId}`);

    return { success: true, message: 'Item successfully moved to cart' };
  },

  /**
   * Clear user's entire wishlist
   */
  async clearWishlist(userId) {
    await wishlistRepository.clearWishlist(userId);
    return { success: true, message: 'Wishlist cleared successfully' };
  },

  /**
   * Check if a product is in user's wishlist
   */
  async isInWishlist(userId, productId) {
    const item = await wishlistRepository.findByUserIdAndProductId(userId, productId);
    return !!item;
  },
};

export default wishlistService;
