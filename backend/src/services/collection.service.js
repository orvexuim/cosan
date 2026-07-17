import { CollectionRepository } from '../repositories/collection.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { slugify } from '../utils/slugify.js';

export const CollectionService = {
  /**
   * Get all collections.
   */
  async getAll() {
    return CollectionRepository.findAll();
  },

  /**
   * Get collection by ID.
   */
  async getById(id) {
    const collection = await CollectionRepository.findById(id);
    if (!collection) {
      throw new ApiError(404, 'Collection not found');
    }
    return collection;
  },

  /**
   * Get collection by slug.
   */
  async getBySlug(slug) {
    const collection = await CollectionRepository.findBySlug(slug);
    if (!collection) {
      throw new ApiError(404, 'Collection not found');
    }
    return collection;
  },

  /**
   * Create a collection (Admin).
   */
  async create(data) {
    const slug = data.slug || slugify(data.name);

    const existing = await CollectionRepository.findBySlug(slug);
    if (existing) {
      throw new ApiError(400, `Collection with slug '${slug}' already exists`);
    }

    return CollectionRepository.create({
      ...data,
      slug
    });
  },

  /**
   * Update a collection (Admin).
   */
  async update(id, data) {
    const collection = await CollectionRepository.findById(id);
    if (!collection) {
      throw new ApiError(404, 'Collection not found');
    }

    const updateData = { ...data };

    if (data.name && !data.slug) {
      updateData.slug = slugify(data.name);
    }

    if (updateData.slug && updateData.slug !== collection.slug) {
      const existing = await CollectionRepository.findBySlug(updateData.slug);
      if (existing && existing.id !== id) {
        throw new ApiError(400, `Collection with slug '${updateData.slug}' already exists`);
      }
    }

    return CollectionRepository.update(id, updateData);
  },

  /**
   * Delete a collection (Admin).
   */
  async delete(id) {
    const collection = await CollectionRepository.findById(id);
    if (!collection) {
      throw new ApiError(404, 'Collection not found');
    }
    return CollectionRepository.delete(id);
  },

  /**
   * Get products in a collection.
   */
  async getProducts(slug, pagination) {
    const collection = await CollectionRepository.findBySlug(slug);
    if (!collection) {
      throw new ApiError(404, 'Collection not found');
    }

    return CollectionRepository.findProducts(collection.id, pagination);
  }
};
