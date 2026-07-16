import { cartService } from '../services/cart.service.js';
import { successResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user.id);
  return res.status(200).json(successResponse(cart, 'Cart fetched successfully'));
});

export const addItem = asyncHandler(async (req, res) => {
  const { productId, productVariantId, quantity } = req.body;
  const cart = await cartService.addItem(req.user.id, { productId, productVariantId, quantity });
  return res.status(200).json(successResponse(cart, 'Item added to cart successfully'));
});

export const updateItem = asyncHandler(async (req, res) => {
  const { id } = req.params; // CartItem ID
  const { quantity } = req.body;
  const cart = await cartService.updateItemQuantity(req.user.id, id, quantity);
  return res.status(200).json(successResponse(cart, 'Cart item updated successfully'));
});

export const removeItem = asyncHandler(async (req, res) => {
  const { id } = req.params; // CartItem ID
  const cart = await cartService.removeItem(req.user.id, id);
  return res.status(200).json(successResponse(cart, 'Cart item removed successfully'));
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart(req.user.id);
  return res.status(200).json(successResponse(cart, 'Cart cleared successfully'));
});

export const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const cart = await cartService.applyCoupon(req.user.id, code);
  return res.status(200).json(successResponse(cart, 'Coupon applied successfully'));
});
