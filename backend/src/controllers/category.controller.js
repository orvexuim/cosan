import { CategoryService } from '../services/category.service.js';
import { successResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const CategoryController = {
  /**
   * @swagger
   * /categories:
   *   get:
   *     summary: Get all categories
   *     tags: [Categories]
   */
  getAll: asyncHandler(async (req, res) => {
    const categories = await CategoryService.getAll();
    return res.status(200).json(successResponse(categories, 'Categories retrieved successfully'));
  }),

  /**
   * @swagger
   * /categories/tree:
   *   get:
   *     summary: Get hierarchical category tree
   *     tags: [Categories]
   */
  getTree: asyncHandler(async (req, res) => {
    const tree = await CategoryService.getTree();
    return res.status(200).json(successResponse(tree, 'Category tree tree retrieved successfully'));
  }),

  /**
   * @swagger
   * /categories/{slug}:
   *   get:
   *     summary: Get category by slug
   *     tags: [Categories]
   */
  getBySlug: asyncHandler(async (req, res) => {
    const category = await CategoryService.getBySlug(req.params.slug);
    return res.status(200).json(successResponse(category, 'Category retrieved successfully'));
  }),

  /**
   * @swagger
   * /categories/id/{id}:
   *   get:
   *     summary: Get category by ID
   *     tags: [Categories]
   */
  getById: asyncHandler(async (req, res) => {
    const category = await CategoryService.getById(req.params.id);
    return res.status(200).json(successResponse(category, 'Category retrieved successfully'));
  }),

  /**
   * @swagger
   * /categories:
   *   post:
   *     summary: Create category (Admin)
   *     tags: [Categories]
   */
  create: asyncHandler(async (req, res) => {
    const category = await CategoryService.create(req.body);
    return res.status(201).json(successResponse(category, 'Category created successfully'));
  }),

  /**
   * @swagger
   * /categories/{id}:
   *   put:
   *     summary: Update category (Admin)
   *     tags: [Categories]
   */
  update: asyncHandler(async (req, res) => {
    const category = await CategoryService.update(req.params.id, req.body);
    return res.status(200).json(successResponse(category, 'Category updated successfully'));
  }),

  /**
   * @swagger
   * /categories/{id}:
   *   delete:
   *     summary: Delete category (Admin)
   *     tags: [Categories]
   */
  delete: asyncHandler(async (req, res) => {
    await CategoryService.delete(req.params.id);
    return res.status(200).json(successResponse(null, 'Category deleted successfully'));
  })
};
