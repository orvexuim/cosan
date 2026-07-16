import { jest } from '@jest/globals';
import cartService from '../../src/services/cart.service.js';
import couponService from '../../src/services/coupon.service.js';
import mockPrisma from '../helpers/mockDb.js';
import { mockProduct, mockProductVariant, mockCart, mockCartItem, mockCoupon } from '../helpers/mockData.js';
import ApiError from '../../src/utils/ApiError.js';

describe('CartService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('should return existing cart for user if found', async () => {
      const cart = mockCart({ userId: 'user-123' });
      mockPrisma.cart.findUnique.mockSetValue(cart);

      const result = await cartService.getCart('user-123');

      expect(mockPrisma.cart.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        include: {
          items: {
            include: { product: true, variant: true }
          }
        }
      });
      expect(result.id).toBe(cart.id);
    });

    it('should create new cart if not found', async () => {
      mockPrisma.cart.findUnique.mockSetValue(null);
      const newCart = mockCart({ userId: 'user-123', items: [] });
      mockPrisma.cart.create.mockSetValue(newCart);

      const result = await cartService.getCart('user-123');

      expect(mockPrisma.cart.create).toHaveBeenCalledWith({
        data: { userId: 'user-123' },
        include: {
          items: {
            include: { product: true, variant: true }
          }
        }
      });
      expect(result.items).toHaveLength(0);
    });
  });

  describe('addItem', () => {
    it('should add item to cart successfully', async () => {
      const p = mockProduct();
      const variant = mockProductVariant({ id: 'variant-222', stock: 10 });
      const cart = mockCart({ items: [] });

      mockPrisma.product.findUnique.mockSetValue(p);
      mockPrisma.productVariant.findFirst.mockSetValue(variant);
      mockPrisma.cart.findUnique.mockSetValue(cart);
      mockPrisma.cartItem.create.mockSetValue({});

      const finalCart = mockCart({
        items: [mockCartItem({ productId: p.id, productVariantId: variant.id, quantity: 2 })]
      });
      // Second findUnique mock sequence via helper or setting value again
      mockPrisma.cart.findUnique.mockImplementation(() => Promise.resolve(finalCart));

      const result = await cartService.addItem('user-123', p.id, variant.id, 2);

      expect(mockPrisma.product.findUnique).toHaveBeenCalled();
      expect(mockPrisma.cartItem.create).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
    });

    it('should throw ApiError if product is not found', async () => {
      mockPrisma.product.findUnique.mockSetValue(null);

      await expect(cartService.addItem('user-123', 'nonexistent', null, 1))
        .rejects.toThrow(ApiError);
    });

    it('should throw ApiError if variant stock is insufficient', async () => {
      const p = mockProduct();
      const variant = mockProductVariant({ stock: 1 }); // only 1 in stock

      mockPrisma.product.findUnique.mockSetValue(p);
      mockPrisma.productVariant.findFirst.mockSetValue(variant);

      await expect(cartService.addItem('user-123', p.id, variant.id, 5))
        .rejects.toThrow(ApiError);
    });
  });

  describe('updateItem', () => {
    it('should update item quantity successfully', async () => {
      const cartItem = mockCartItem({
        variant: mockProductVariant({ stock: 15 })
      });
      mockPrisma.cartItem.findUnique.mockSetValue(cartItem);
      mockPrisma.cartItem.update.mockSetValue({});
      
      const cart = mockCart();
      mockPrisma.cart.findUnique.mockSetValue(cart);

      const result = await cartService.updateItem('user-123', cartItem.id, 5);

      expect(mockPrisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: cartItem.id },
        data: { quantity: 5 }
      });
    });

    it('should throw ApiError if update item quantity exceeds stock', async () => {
      const cartItem = mockCartItem({
        variant: mockProductVariant({ stock: 5 })
      });
      mockPrisma.cartItem.findUnique.mockSetValue(cartItem);

      await expect(cartService.updateItem('user-123', cartItem.id, 10))
        .rejects.toThrow(ApiError);
    });
  });

  describe('removeItem', () => {
    it('should delete a cart item', async () => {
      const cartItem = mockCartItem();
      mockPrisma.cartItem.findUnique.mockSetValue(cartItem);
      mockPrisma.cartItem.delete.mockSetValue({});
      mockPrisma.cart.findUnique.mockSetValue(mockCart({ items: [] }));

      const result = await cartService.removeItem('user-123', cartItem.id);

      expect(mockPrisma.cartItem.delete).toHaveBeenCalledWith({
        where: { id: cartItem.id }
      });
    });
  });

  describe('clearCart', () => {
    it('should delete all cart items for user', async () => {
      const cart = mockCart();
      mockPrisma.cart.findUnique.mockSetValue(cart);
      mockPrisma.cartItem.deleteMany.mockSetValue({ count: 1 });

      await cartService.clearCart('user-123');

      expect(mockPrisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: cart.id }
      });
    });
  });

  describe('applyCoupon', () => {
    it('should calculate discount for valid coupon', async () => {
      const item = mockCartItem({ price: 200.0, quantity: 1 });
      const cart = mockCart({ items: [item] });
      mockPrisma.cart.findUnique.mockSetValue(cart);

      const coupon = mockCoupon({
        type: 'PERCENTAGE',
        value: 10,
        minAmount: 150
      });
      jest.spyOn(couponService, 'validateCoupon').mockResolvedValue(coupon);

      const result = await cartService.applyCoupon('user-123', 'COSMANSPRING10');

      expect(result.subtotal).toBe(200.0);
      expect(result.discount).toBe(20.0);
      expect(result.total).toBe(180.0);
    });

    it('should throw ApiError if cart is empty', async () => {
      const cart = mockCart({ items: [] });
      mockPrisma.cart.findUnique.mockSetValue(cart);

      await expect(cartService.applyCoupon('user-123', 'COSMANSPRING10'))
        .rejects.toThrow(ApiError);
    });
  });
});
