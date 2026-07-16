import { PrismaClient } from '@prisma/client';
import ApiError from '../utils/ApiError.js';
import couponService from './coupon.service.js';

const prisma = new PrismaClient();

export class CartService {
  async getCart(userId) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: true,
              variant: true
            }
          }
        }
      });
    }

    return cart;
  }

  async addItem(userId, productId, variantId, quantity = 1) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    let price = product.price;

    if (variantId) {
      const variant = await prisma.productVariant.findFirst({
        where: { id: variantId, productId }
      });

      if (!variant) {
        throw new ApiError(404, 'Product variant not found');
      }

      if (variant.stock < quantity) {
        throw new ApiError(400, 'Product variant is out of stock / insufficient stock');
      }

      price = product.price + variant.priceAdjustment;
    }

    const cart = await this.getCart(userId);

    const existingItem = cart.items.find(item => 
      item.productId === productId && item.productVariantId === variantId
    );

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          productVariantId: variantId,
          quantity,
          price
        }
      });
    }

    return this.getCart(userId);
  }

  async updateItem(userId, cartItemId, quantity) {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { variant: true }
    });

    if (!cartItem) {
      throw new ApiError(404, 'Cart item not found');
    }

    if (cartItem.variant && cartItem.variant.stock < quantity) {
      throw new ApiError(400, 'Insufficient stock available');
    }

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity }
    });

    return this.getCart(userId);
  }

  async removeItem(userId, cartItemId) {
    const cartItem = await prisma.cartItem.findUnique({ where: { id: cartItemId } });
    if (!cartItem) {
      throw new ApiError(404, 'Cart item not found');
    }

    await prisma.cartItem.delete({ where: { id: cartItemId } });

    return this.getCart(userId);
  }

  async clearCart(userId) {
    const cart = await this.getCart(userId);

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    return this.getCart(userId);
  }

  async applyCoupon(userId, couponCode) {
    const cart = await this.getCart(userId);
    if (!cart.items.length) {
      throw new ApiError(400, 'Cannot apply coupon to an empty cart');
    }

    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const coupon = await couponService.validateCoupon(couponCode, subtotal);

    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else if (coupon.type === 'FIXED_AMOUNT') {
      discount = coupon.value;
    }

    discount = Math.min(discount, subtotal);

    return {
      coupon,
      subtotal,
      discount,
      total: subtotal - discount
    };
  }
}

export default new CartService();
