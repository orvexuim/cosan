import { CollectionService } from '../services/collection.service.js';
import { successResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePagination, formatPaginatedResponse } from '../utils/pagination.js';

export const CollectionController = {
  /**
   * @swagger
   * /collections:
   *   get:
   *     summary: Get all collections
   *     tags: [Collections]
   */
  getAll: asyncHandler(async (req, res) => {
    const collections = await CollectionService.getAll();
    return res.status(200).json(successResponse(collections, 'Collections retrieved successfully'));
  }),

  /**
   * @swagger
   * /collections/{slug}:
   *   get:
   *     summary: Get collection by slug
   *     tags: [Collections]
   */
  getBySlug: asyncHandler(async (req, res) => {
    const collection = await CollectionService.getBySlug(req.params.slug);
    return res.status(200).json(successResponse(collection, 'Collection retrieved successfully'));
  }),

  /**
   * @swagger
   * /collections/id/{id}:
   *   get:
   *     summary: Get collection by ID
   *     tags: [Collections]
   */
  getById: asyncHandler(async (req, res) => {
    const collection = await CollectionService.getById(req.params.id);
    return res.status(200).json(successResponse(collection, 'Collection retrieved successfully'));
  }),

  /**
   * @swagger
   * /collections/{slug}/products:
   *   get:
   *     summary: Get products in a collection
   *     tags: [Collections]
   */
  getProducts: asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const { products, total } = await CollectionService.getProducts(req.params.slug, pagination);
    return res.status(200).json(
      successResponse(
        formatPaginatedResponse(products, total, pagination.page, pagination.limit),
        'Collection products retrieved successfully'
      )
    );
  }),

  /**
   * @swagger
   * /collections:
   *   post:
   *     summary: Create collection (Admin)
   *     tags: [Collections]
   */
  create: asyncHandler(async (req, res) => {
    const collection = await CollectionService.create(req.body);
    return res.status(201).json(successResponse(collection, 'Collection created successfully'));
  }),

  /**
   * @swagger
   * /collections/{id}:
   *   put:
   *     summary: Update collection (Admin)
   *     tags: [Collections]
   */
  update: asyncHandler(async (req, res) => {
    const collection = await CollectionService.update(req.params.id, req.body);
    return res.status(200).json(successResponse(collection, 'Collection updated successfully'));
  }),

  /**
   * @swagger
   * /collections/{id}:
   *   delete:
   *     summary: Delete collection (Admin)
   *     tags: [Collections]
   */
  delete: asyncHandler(async (req, res) => {
    await CollectionService.delete(req.params.id);
    return res.status(200).json(successResponse(null, 'Collection deleted successfully'));
  })
};
