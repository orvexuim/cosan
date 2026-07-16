import { prisma } from '../config/database.js';

export const wishlistRepository = {
  /**
   * Get user's wishlist
   */
  async findByUserId(userId) {
    return prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            variants: true,
          },
        },
      },
    });
  },

  /**
   * Add a product to wishlist
   */
  async addItem(userId, productId) {
    return prisma.wishlist.upsert({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      update: {},
      create: {
        userId,
        productId,
      },
    });
  },

  /**
   * Remove a product from wishlist
   */
  async removeItem(userId, productId) {
    return prisma.wishlist.deleteMany({
      where: {
        userId,
        productId,
      },
    });
  },

  /**
   * Find a specific wishlist item
   */
  async findByUserIdAndProductId(userId, productId) {
    return prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
  },

  /**
   * Clear user's entire wishlist
   */
  async clearWishlist(userId) {
    return prisma.wishlist.deleteMany({
      where: { userId },
    });
  },

  /**
   * Move item from wishlist to cart
   */
  async moveToCart(userId, productId, productVariantId = null) {
    return prisma.$transaction(async (tx) => {
      // 1. Delete from wishlist
      await tx.wishlist.deleteMany({
        where: {
          userId,
          productId,
        },
      });

      // 2. Find or create Cart
      let cart = await tx.cart.findUnique({
        where: { userId },
      });

      if (!cart) {
        cart = await tx.cart.create({
          data: { userId },
        });
      }

      // 3. Get product price
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      // 4. Find existing item in cart
      const existingCartItem = await tx.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
          productVariantId,
        },
      });

      if (existingCartItem) {
        return tx.cartItem.update({
          where: { id: existingCartItem.id },
          data: {
            quantity: existingCartItem.quantity + 1,
          },
        });
      }

      return tx.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          productVariantId,
          quantity: 1,
          price: product.price,
        },
      });
    });
  },
};

export default wishlistRepository;
