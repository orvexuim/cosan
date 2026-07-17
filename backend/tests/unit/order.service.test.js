import { jest } from '@jest/globals';
import orderService from '../../src/services/order.service.js';
import cartService from '../../src/services/cart.service.js';
import couponService from '../../src/services/coupon.service.js';
import mockPrisma from '../helpers/mockDb.js';
import { mockOrder, mockCart, mockCartItem, mockProduct, mockProductVariant, mockAddress, mockCoupon } from '../helpers/mockData.js';
import ApiError from '../../src/utils/ApiError.js';

describe('OrderService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateOrderNumber', () => {
    it('should generate a valid order number structure', () => {
      const num = orderService.generateOrderNumber();
      expect(num).toMatch(/^CSM-\d+-\d+$/);
    });
  });

  describe('createOrder', () => {
    it('should successfully place an order and empty the cart', async () => {
      const userId = 'user-123';
      const address = mockAddress();
      const product = mockProduct();
      const variant = mockProductVariant({ stock: 50 });
      const item = mockCartItem({
        price: 249.99,
        quantity: 1,
        productId: product.id,
        productVariantId: variant.id,
        product,
        variant
      });
      const cart = mockCart({ items: [item] });

      // Mock dependencies
      jest.spyOn(cartService, 'getCart').mockResolvedValue(cart);
      mockPrisma.product.findUnique.mockSetValue(product);
      mockPrisma.productVariant.findUnique.mockSetValue(variant);
      mockPrisma.address.findUnique.mockSetValue(address);

      // Setup mock return for transaction
      const order = mockOrder({
        userId,
        items: [item]
      });
      mockPrisma.order.create.mockSetValue(order);
      // Prisma transaction executes callback returning order
      mockPrisma.productVariant.update.mockSetValue({});
      mockPrisma.cartItem.deleteMany.mockSetValue({ count: 1 });

      const result = await orderService.createOrder(userId, {
        shippingAddressId: address.id,
        paymentMethod: 'STRIPE',
        notes: 'Hurry up!'
      });

      expect(result.id).toBe(order.id);
      expect(mockPrisma.address.findUnique).toHaveBeenCalled();
    });

    it('should throw ApiError if cart is empty', async () => {
      jest.spyOn(cartService, 'getCart').mockResolvedValue(mockCart({ items: [] }));

      await expect(orderService.createOrder('user-123', {
        shippingAddressId: 'addr-123',
        paymentMethod: 'STRIPE'
      })).rejects.toThrow(ApiError);
    });

    it('should throw ApiError if variant stock is insufficient', async () => {
      const product = mockProduct();
      const variant = mockProductVariant({ stock: 1 }); // only 1 left
      const item = mockCartItem({
        productId: product.id,
        productVariantId: variant.id,
        quantity: 5 // requesting 5
      });
      const cart = mockCart({ items: [item] });

      jest.spyOn(cartService, 'getCart').mockResolvedValue(cart);
      mockPrisma.product.findUnique.mockSetValue(product);
      mockPrisma.productVariant.findUnique.mockSetValue(variant);

      await expect(orderService.createOrder('user-123', {
        shippingAddressId: 'addr-123',
        paymentMethod: 'STRIPE'
      })).rejects.toThrow(ApiError);
    });

    it('should throw ApiError if shipping address does not exist', async () => {
      const product = mockProduct();
      const variant = mockProductVariant({ stock: 10 });
      const item = mockCartItem({
        productId: product.id,
        productVariantId: variant.id,
        quantity: 1
      });
      const cart = mockCart({ items: [item] });

      jest.spyOn(cartService, 'getCart').mockResolvedValue(cart);
      mockPrisma.product.findUnique.mockSetValue(product);
      mockPrisma.productVariant.findUnique.mockSetValue(variant);
      mockPrisma.address.findUnique.mockSetValue(null); // address not found

      await expect(orderService.createOrder('user-123', {
        shippingAddressId: 'addr-invalid',
        paymentMethod: 'STRIPE'
      })).rejects.toThrow(ApiError);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order and restore stocks successfully', async () => {
      const order = mockOrder({ status: 'PENDING', userId: 'user-123' });
      mockPrisma.order.findUnique.mockSetValue(order);
      mockPrisma.orderItem.findMany.mockSetValue(order.items);
      mockPrisma.productVariant.update.mockSetValue({});
      
      const cancelledOrder = mockOrder({ ...order, status: 'CANCELLED' });
      mockPrisma.order.update.mockSetValue(cancelledOrder);

      const result = await orderService.cancelOrder('user-123', order.id);

      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({ where: { id: order.id } });
      expect(result.status).toBe('CANCELLED');
    });

    it('should throw ApiError if wrong user attempts to cancel other customer order', async () => {
      const order = mockOrder({ userId: 'another-user' });
      mockPrisma.order.findUnique.mockSetValue(order);

      await expect(orderService.cancelOrder('user-123', order.id, 'CUSTOMER'))
        .rejects.toThrow(ApiError);
    });

    it('should throw ApiError if order is already shipped', async () => {
      const order = mockOrder({ status: 'SHIPPED', userId: 'user-123' });
      mockPrisma.order.findUnique.mockSetValue(order);

      await expect(orderService.cancelOrder('user-123', order.id))
        .rejects.toThrow(ApiError);
    });
  });

  describe('updateOrderStatus', () => {
    it('should successfully change status of an order', async () => {
      const order = mockOrder();
      mockPrisma.order.findUnique.mockSetValue(order);

      const updated = mockOrder({ ...order, status: 'SHIPPED' });
      mockPrisma.order.update.mockSetValue(updated);

      const result = await orderService.updateOrderStatus(order.id, 'SHIPPED');

      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: order.id },
        data: { status: 'SHIPPED' },
        include: { items: true }
      });
      expect(result.status).toBe('SHIPPED');
    });
  });
});
