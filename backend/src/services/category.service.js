import { CategoryRepository } from '../repositories/category.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { slugify } from '../utils/slugify.js';

export const CategoryService = {
  /**
   * Get all categories.
   */
  async getAll() {
    return CategoryRepository.findAll();
  },

  /**
   * Get category by ID.
   */
  async getById(id) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
    return category;
  },

  /**
   * Get category by Slug.
   */
  async getBySlug(slug) {
    const category = await CategoryRepository.findBySlug(slug);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
    return category;
  },

  /**
   * Create a new category (Admin).
   */
  async create(data) {
    const slug = data.slug || slugify(data.name);

    // Ensure uniqueness
    const existing = await CategoryRepository.findBySlug(slug);
    if (existing) {
      throw new ApiError(400, `Category with name or slug '${slug}' already exists`);
    }

    if (data.parentId) {
      const parent = await CategoryRepository.findById(data.parentId);
      if (!parent) {
        throw new ApiError(404, 'Parent category not found');
      }
    }

    return CategoryRepository.create({
      ...data,
      slug
    });
  },

  /**
   * Update category (Admin).
   */
  async update(id, data) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    const updateData = { ...data };

    if (data.name && !data.slug) {
      updateData.slug = slugify(data.name);
    }

    if (updateData.slug && updateData.slug !== category.slug) {
      const existing = await CategoryRepository.findBySlug(updateData.slug);
      if (existing && existing.id !== id) {
        throw new ApiError(400, `Category with slug '${updateData.slug}' already exists`);
      }
    }

    if (data.parentId) {
      if (data.parentId === id) {
        throw new ApiError(400, 'A category cannot be its own parent');
      }
      const parent = await CategoryRepository.findById(data.parentId);
      if (!parent) {
        throw new ApiError(404, 'Parent category not found');
      }
    }

    return CategoryRepository.update(id, updateData);
  },

  /**
   * Delete category (Admin).
   */
  async delete(id) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    // Set child categories to have no parent or Cascade handle it
    const subcategories = await CategoryRepository.findSubcategories(id);
    if (subcategories.length > 0) {
      for (const sub of subcategories) {
        await CategoryRepository.update(sub.id, { parentId: null });
      }
    }

    return CategoryRepository.delete(id);
  },

  /**
   * Get recursive category hierarchy tree.
   */
  async getTree() {
    return CategoryRepository.findTree();
  }
};
