import { PrismaClient } from '@prisma/client';
import ApiError from '../utils/ApiError.js';
import cartService from './cart.service.js';
import couponService from './coupon.service.js';

const prisma = new PrismaClient();

export class OrderService {
  generateOrderNumber() {
    const prefix = 'CSM';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${timestamp}-${random}`;
  }

  async createOrder(userId, data) {
    const { shippingAddressId, paymentMethod, couponCode, notes } = data;

    // Get Cart
    const cart = await cartService.getCart(userId);
    if (!cart.items || !cart.items.length) {
      throw new ApiError(400, 'Cannot place an order with an empty cart');
    }

    // Check items stock and validity
    for (const item of cart.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        throw new ApiError(404, `Product not found: ${item.productId}`);
      }

      if (item.productVariantId) {
        const variant = await prisma.productVariant.findUnique({ where: { id: item.productVariantId } });
        if (!variant) {
          throw new ApiError(404, `Product variant not found: ${item.productVariantId}`);
        }
        if (variant.stock < item.quantity) {
          throw new ApiError(400, `Insufficient stock for product ${product.name} variant size ${variant.size}`);
        }
      }
    }

    // Verify Address
    const address = await prisma.address.findUnique({ where: { id: shippingAddressId } });
    if (!address) {
      throw new ApiError(404, 'Shipping address not found');
    }

    // Calculate subtotal
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Apply Coupon if present
    let discount = 0.0;
    let couponId = null;
    if (couponCode) {
      const coupon = await couponService.validateCoupon(couponCode, subtotal);
      couponId = coupon.id;
      
      if (coupon.type === 'PERCENTAGE') {
        discount = (subtotal * coupon.value) / 100;
        if (coupon.maxDiscount) {
          discount = Math.min(discount, coupon.maxDiscount);
        }
      } else if (coupon.type === 'FIXED_AMOUNT') {
        discount = coupon.value;
      }
      discount = Math.min(discount, subtotal);
    }

    const shippingCost = subtotal - discount > 300 ? 0.0 : 15.0; // Free shipping on orders > 300
    const taxAmount = parseFloat(((subtotal - discount) * 0.1).toFixed(2)); // 10% VAT
    const totalAmount = parseFloat((subtotal - discount + shippingCost + taxAmount).toFixed(2));

    const orderNumber = this.generateOrderNumber();

    // Create Order with Transaction to deduct stocks and clear cart
    const order = await prisma.$transaction(async (tx) => {
      // Deduct stock
      for (const item of cart.items) {
        if (item.productVariantId) {
          await tx.productVariant.update({
            where: { id: item.productVariantId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          });
        }
      }

      // Increment coupon usage if used
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: {
            usedCount: {
              increment: 1
            }
          }
        });
      }

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          userId,
          orderNumber,
          status: 'PENDING',
          subtotal,
          discount,
          shippingCost,
          taxAmount,
          totalAmount,
          couponId,
          shippingAddressId,
          paymentMethod,
          paymentStatus: 'PENDING',
          notes,
          items: {
            create: cart.items.map(item => ({
              productId: item.productId,
              productVariantId: item.productVariantId,
              productName: item.product.name,
              productImage: item.product.mainImage,
              size: item.variant?.size || null,
              color: item.variant?.color || null,
              quantity: item.quantity,
              price: item.price
            }))
          }
        },
        include: {
          items: true
        }
      });

      // Clear Cart Items
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      return newOrder;
    });

    return order;
  }

  async cancelOrder(userId, orderId, userRole = 'CUSTOMER') {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    // Security check: must be owner or admin/mod
    if (userRole === 'CUSTOMER' && order.userId !== userId) {
      throw new ApiError(403, 'You are not authorized to cancel this order');
    }

    // Cancellation restrictions
    if (['SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status)) {
      throw new ApiError(400, `Cannot cancel order with status ${order.status}`);
    }

    // Cancel order and return items to stock
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const items = await tx.orderItem.findMany({
        where: { orderId }
      });

      // Return stocks
      for (const item of items) {
        if (item.productVariantId) {
          await tx.productVariant.update({
            where: { id: item.productVariantId },
            data: {
              stock: {
                increment: item.quantity
              }
            }
          });
        }
      }

      // Update order status
      return tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
        include: { items: true }
      });
    });

    return updatedOrder;
  }

  async updateOrderStatus(orderId, status) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: true }
    });

    return updated;
  }
}

export default new OrderService();
