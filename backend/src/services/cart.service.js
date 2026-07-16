import { cartRepository } from '../repositories/cart.repository.js';
import { couponRepository } from '../repositories/coupon.repository.js';
import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { cache } from '../config/redis.js';

const CART_CACHE_TTL = 1800; // 30 minutes in seconds

export const cartService = {
  /**
   * Helper to fetch fresh cart, calculate pricing with Morocco VAT (20%), and cache it
   */
  async getCartAndRecalculate(userId, couponCode = null) {
    const cart = await cartRepository.findOrCreateByUserId(userId);
    
    let subtotal = 0;
    const items = cart.items.map((item) => {
      const itemPrice = item.variant ? (item.product.price + item.variant.priceAdjustment) : item.product.price;
      const totalItemPrice = itemPrice * item.quantity;
      subtotal += totalItemPrice;
      
      return {
        id: item.id,
        productId: item.productId,
        productVariantId: item.productVariantId,
        productName: item.product.name,
        productSlug: item.product.slug,
        productImage: item.product.mainImage,
        size: item.variant?.size || null,
        color: item.variant?.color || null,
        sku: item.variant?.sku || item.product.sku,
        quantity: item.quantity,
        price: itemPrice,
        totalPrice: totalItemPrice,
        stock: item.variant?.stock ?? 10, // Default fallback if needed
      };
    });

    let discount = 0;
    let coupon = null;

    if (couponCode) {
      const validation = await couponRepository.isValid(couponCode, subtotal);
      if (validation.valid) {
        coupon = validation.coupon;
        if (coupon.type === 'PERCENTAGE') {
          discount = (subtotal * coupon.value) / 100;
          if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
          }
        } else if (coupon.type === 'FIXED_AMOUNT') {
          discount = coupon.value;
        }
        // Discount cannot exceed subtotal
        if (discount > subtotal) {
          discount = subtotal;
        }
      }
    }

    const discountedSubtotal = subtotal - discount;
    const taxAmount = Number((discountedSubtotal * 0.20).toFixed(2)); // 20% Morocco VAT
    
    // Free shipping above $150, otherwise flat $15 shipping
    const shippingCost = subtotal > 150 || subtotal === 0 ? 0 : 15;
    const totalAmount = Number((discountedSubtotal + taxAmount + shippingCost).toFixed(2));

    const cartResult = {
      id: cart.id,
      userId: cart.userId,
      items,
      totals: {
        subtotal,
        discount,
        taxAmount,
        shippingCost,
        totalAmount,
      },
      coupon: coupon ? { code: coupon.code, value: coupon.value, type: coupon.type } : null,
    };

    // Cache cart in Redis
    await cache.set(`cart:${userId}`, cartResult, CART_CACHE_TTL);

    return cartResult;
  },

  /**
   * Get Cart
   */
  async getCart(userId) {
    const cached = await cache.get(`cart:${userId}`);
    if (cached) return cached;

    return this.getCartAndRecalculate(userId);
  },

  /**
   * Add Item
   */
  async addItem(userId, { productId, productVariantId, quantity }) {
    // Verify product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
      include: { variants: true },
    });

    if (!product) {
      throw new ApiError(404, 'Active product not found');
    }

    let price = product.price;

    if (productVariantId) {
      const variant = product.variants.find((v) => v.id === productVariantId && v.isActive);
      if (!variant) {
        throw new ApiError(404, 'Product variant not found or inactive');
      }
      if (variant.stock < quantity) {
        throw new ApiError(400, `Insufficient stock. Only ${variant.stock} units available.`);
      }
      price += variant.priceAdjustment;
    }

    const cart = await cartRepository.findOrCreateByUserId(userId);
    await cartRepository.addItem(cart.id, { productId, productVariantId, quantity, price });

    // Invalidate Cache and return fresh recalculated cart
    await cache.del(`cart:${userId}`);
    return this.getCartAndRecalculate(userId);
  },

  /**
   * Update Quantity
   */
  async updateItemQuantity(userId, cartItemId, quantity) {
    const cart = await cartRepository.findOrCreateByUserId(userId);
    const cartItem = cart.items.find((item) => item.id === cartItemId);

    if (!cartItem) {
      throw new ApiError(404, 'Cart item not found');
    }

    if (cartItem.productVariantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: cartItem.productVariantId },
      });
      if (!variant || variant.stock < quantity) {
        throw new ApiError(400, `Insufficient stock. Only ${variant?.stock || 0} units available.`);
      }
    }

    await cartRepository.updateItemQuantity(cartItemId, quantity);

    // Invalidate Cache and return fresh recalculated cart
    await cache.del(`cart:${userId}`);
    return this.getCartAndRecalculate(userId);
  },

  /**
   * Remove Item
   */
  async removeItem(userId, cartItemId) {
    const cart = await cartRepository.findOrCreateByUserId(userId);
    const cartItem = cart.items.find((item) => item.id === cartItemId);

    if (!cartItem) {
      throw new ApiError(404, 'Cart item not found');
    }

    await cartRepository.removeItem(cartItemId);

    // Invalidate Cache
    await cache.del(`cart:${userId}`);
    return this.getCartAndRecalculate(userId);
  },

  /**
   * Clear Cart
   */
  async clearCart(userId) {
    const cart = await cartRepository.findOrCreateByUserId(userId);
    await cartRepository.clearCart(cart.id);

    // Invalidate Cache
    await cache.del(`cart:${userId}`);
    return this.getCartAndRecalculate(userId);
  },

  /**
   * Apply Coupon
   */
  async applyCoupon(userId, couponCode) {
    const cart = await cartRepository.findOrCreateByUserId(userId);
    if (cart.items.length === 0) {
      throw new ApiError(400, 'Cannot apply coupon to an empty cart');
    }

    const validation = await couponRepository.isValid(couponCode, 0); // basic existence check
    if (!validation.valid) {
      throw new ApiError(400, validation.message);
    }

    // This will calculate values with the applied coupon code
    return this.getCartAndRecalculate(userId, couponCode);
  },

  /**
   * Calculate totals explicitly
   */
  async getCartTotals(userId, couponCode = null) {
    const cart = await this.getCartAndRecalculate(userId, couponCode);
    return cart.totals;
  },
};

export default cartService;
