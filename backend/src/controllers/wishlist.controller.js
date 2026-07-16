import { wishlistService } from '../services/wishlist.service.js';
import { successResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.getWishlist(req.user.id);
  return res.status(200).json(successResponse(wishlist, 'Wishlist fetched successfully'));
});

export const add = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const item = await wishlistService.addToWishlist(req.user.id, productId);
  return res.status(201).json(successResponse(item, 'Product added to wishlist'));
});

export const remove = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const result = await wishlistService.removeFromWishlist(req.user.id, productId);
  return res.status(200).json(successResponse(result, 'Product removed from wishlist'));
});

export const moveToCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { productVariantId } = req.body;
  const result = await wishlistService.moveToCart(req.user.id, productId, productVariantId);
  return res.status(200).json(successResponse(result, 'Product moved to cart successfully'));
});

export const clear = asyncHandler(async (req, res) => {
  const result = await wishlistService.clearWishlist(req.user.id);
  return res.status(200).json(successResponse(result, 'Wishlist cleared successfully'));
});
