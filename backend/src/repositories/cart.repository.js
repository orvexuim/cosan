import { prisma } from '../config/database.js';

export const cartRepository = {
  /**
   * Find a cart by user ID, or create it if it doesn't exist
   */
  async findOrCreateByUserId(userId) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      });
    }

    return cart;
  },

  /**
   * Find a cart by its ID with items
   */
  async findByIdWithItems(id) {
    return prisma.cart.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });
  },

  /**
   * Add an item to the cart or update quantity if it already exists
   */
  async addItem(cartId, { productId, productVariantId, quantity, price }) {
    // Check if the item already exists in the cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId,
        productId,
        productVariantId: productVariantId || null,
      },
    });

    if (existingItem) {
      return prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          price, // update to latest price
        },
      });
    }

    return prisma.cartItem.create({
      data: {
        cartId,
        productId,
        productVariantId: productVariantId || null,
        quantity,
        price,
      },
    });
  },

  /**
   * Update cart item quantity
   */
  async updateItemQuantity(cartItemId, quantity) {
    return prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });
  },

  /**
   * Remove item from cart
   */
  async removeItem(cartItemId) {
    return prisma.cartItem.delete({
      where: { id: cartItemId },
    });
  },

  /**
   * Clear all items in a cart
   */
  async clearCart(cartId) {
    return prisma.cartItem.deleteMany({
      where: { cartId },
    });
  },

  /**
   * Find a specific item inside a cart
   */
  async findByUserIdAndProductId(userId, productId, productVariantId = null) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) return null;

    return prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        productVariantId,
      },
    });
  },

  /**
   * Calculate subtotal of cart items
   */
  async calculateTotal(cartId) {
    const aggregations = await prisma.cartItem.aggregate({
      where: { cartId },
      _sum: {
        quantity: true,
      },
    });

    const items = await prisma.cartItem.findMany({
      where: { cartId },
    });

    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    return {
      subtotal,
      itemCount: aggregations._sum.quantity || 0,
    };
  },
};

export default cartRepository;
