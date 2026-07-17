import { ProductService } from '../services/product.service.js';
import { VariantRepository } from '../repositories/variant.repository.js';
import { successResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePagination, formatPaginatedResponse } from '../utils/pagination.js';

export const ProductController = {
  /**
   * @swagger
   * /products:
   *   get:
   *     summary: Get all products with filters
   *     tags: [Products]
   *     parameters:
   *       - name: search
   *         in: query
   *         schema:
   *           type: string
   *       - name: categoryId
   *         in: query
   *         schema:
   *           type: string
   *       - name: collectionId
   *         in: query
   *         schema:
   *           type: string
   *       - name: minPrice
   *         in: query
   *         schema:
   *           type: number
   *       - name: maxPrice
   *         in: query
   *         schema:
   *           type: number
   *       - name: sizes
   *         in: query
   *         schema:
   *           type: string
   *       - name: colors
   *         in: query
   *         schema:
   *           type: string
   *       - name: sortBy
   *         in: query
   *         schema:
   *           type: string
   *           enum: [price_asc, price_desc, newest, rating, popular]
   *       - name: page
   *         in: query
   *         schema:
   *           type: integer
   *       - name: limit
   *         in: query
   *         schema:
   *           type: integer
   */
  getAll: asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const filters = {
      ...req.query,
      ...pagination
    };

    const { products, total } = await ProductService.getAll(filters);
    return res.status(200).json(
      successResponse(
        formatPaginatedResponse(products, total, pagination.page, pagination.limit),
        'Products retrieved successfully'
      )
    );
  }),

  /**
   * @swagger
   * /products/featured:
   *   get:
   *     summary: Get featured products
   *     tags: [Products]
   */
  getFeatured: asyncHandler(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const products = await ProductService.getFeatured(limit);
    return res.status(200).json(successResponse(products, 'Featured products retrieved successfully'));
  }),

  /**
   * @swagger
   * /products/search:
   *   get:
   *     summary: Full text search products
   *     tags: [Products]
   */
  search: asyncHandler(async (req, res) => {
    const { q, limit } = req.query;
    const searchLimit = limit ? parseInt(limit, 10) : 10;
    const products = await ProductService.search(q || '', searchLimit);
    return res.status(200).json(successResponse(products, 'Search results retrieved successfully'));
  }),

  /**
   * @swagger
   * /products/{slug}:
   *   get:
   *     summary: Get product by slug
   *     tags: [Products]
   */
  getBySlug: asyncHandler(async (req, res) => {
    const product = await ProductService.getBySlug(req.params.slug);
    return res.status(200).json(successResponse(product, 'Product retrieved successfully'));
  }),

  /**
   * @swagger
   * /products/{id}/related:
   *   get:
   *     summary: Get related products
   *     tags: [Products]
   */
  getRelated: asyncHandler(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 4;
    const products = await ProductService.getRelated(req.params.id, limit);
    return res.status(200).json(successResponse(products, 'Related products retrieved successfully'));
  }),

  /**
   * @swagger
   * /products:
   *   post:
   *     summary: Create product (Admin)
   *     tags: [Products]
   */
  create: asyncHandler(async (req, res) => {
    const product = await ProductService.create(req.body);
    return res.status(201).json(successResponse(product, 'Product created successfully'));
  }),

  /**
   * @swagger
   * /products/{id}:
   *   put:
   *     summary: Update product (Admin)
   *     tags: [Products]
   */
  update: asyncHandler(async (req, res) => {
    const product = await ProductService.update(req.params.id, req.body);
    return res.status(200).json(successResponse(product, 'Product updated successfully'));
  }),

  /**
   * @swagger
   * /products/{id}:
   *   delete:
   *     summary: Delete product (Admin)
   *     tags: [Products]
   */
  delete: asyncHandler(async (req, res) => {
    await ProductService.delete(req.params.id);
    return res.status(200).json(successResponse(null, 'Product deleted successfully'));
  }),

  /**
   * @swagger
   * /products/{id}/variants:
   *   post:
   *     summary: Create variant for product (Admin)
   *     tags: [Products, Variants]
   */
  createVariant: asyncHandler(async (req, res) => {
    const variantData = {
      ...req.body,
      productId: req.params.id
    };
    const variant = await VariantRepository.create(variantData);
    // Invalidate product cache
    await ProductService.invalidateCache(req.params.id);
    return res.status(201).json(successResponse(variant, 'Product variant created successfully'));
  }),

  /**
   * @swagger
   * /products/{id}/variants/{variantId}:
   *   put:
   *     summary: Update variant for product (Admin)
   *     tags: [Products, Variants]
   */
  updateVariant: asyncHandler(async (req, res) => {
    const variant = await VariantRepository.update(req.params.variantId, req.body);
    // Invalidate product cache
    await ProductService.invalidateCache(req.params.id);
    return res.status(200).json(successResponse(variant, 'Product variant updated successfully'));
  }),

  /**
   * @swagger
   * /products/{id}/variants/{variantId}:
   *   delete:
   *     summary: Delete variant (Admin)
   *     tags: [Products, Variants]
   */
  deleteVariant: asyncHandler(async (req, res) => {
    await VariantRepository.delete(req.params.variantId);
    // Invalidate product cache
    await ProductService.invalidateCache(req.params.id);
    return res.status(200).json(successResponse(null, 'Product variant deleted successfully'));
  })
};
