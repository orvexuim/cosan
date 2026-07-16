import { ProductRepository } from '../repositories/product.repository.js';
import { redis } from '../config/redis.js';
import { ApiError } from '../utils/ApiError.js';
import { slugify } from '../utils/slugify.js';
import { logger } from '../utils/logger.js';

const CACHE_TTL = 300; // 5 minutes

export const ProductService = {
  /**
   * Get all products (with Redis caching).
   */
  async getAll(filters = {}) {
    const cacheKey = `product:list:${JSON.stringify(filters)}`;
    try {
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.info(`Redis cache hit for: ${cacheKey}`);
          return JSON.parse(cached);
        }
      }
    } catch (err) {
      logger.error('Redis read error:', err);
    }

    const result = await ProductRepository.findAll(filters);

    try {
      if (redis) {
        await redis.setWithTTL(cacheKey, JSON.stringify(result), CACHE_TTL);
        logger.info(`Redis cache set for: ${cacheKey}`);
      }
    } catch (err) {
      logger.error('Redis write error:', err);
    }

    return result;
  },

  /**
   * Get product by ID (with Redis caching).
   */
  async getById(id) {
    const cacheKey = `product:detail:id:${id}`;
    try {
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.info(`Redis cache hit for: ${cacheKey}`);
          return JSON.parse(cached);
        }
      }
    } catch (err) {
      logger.error('Redis read error:', err);
    }

    const product = await ProductRepository.findById(id);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    try {
      if (redis) {
        await redis.setWithTTL(cacheKey, JSON.stringify(product), CACHE_TTL);
        // Also link a slug cache key back to this payload for high performance
        await redis.setWithTTL(`product:detail:slug:${product.slug}`, JSON.stringify(product), CACHE_TTL);
        logger.info(`Redis cache set for: ${cacheKey}`);
      }
    } catch (err) {
      logger.error('Redis write error:', err);
    }

    return product;
  },

  /**
   * Get product by slug (with Redis caching).
   */
  async getBySlug(slug) {
    const cacheKey = `product:detail:slug:${slug}`;
    try {
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.info(`Redis cache hit for: ${cacheKey}`);
          return JSON.parse(cached);
        }
      }
    } catch (err) {
      logger.error('Redis read error:', err);
    }

    const product = await ProductRepository.findBySlug(slug);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    try {
      if (redis) {
        await redis.setWithTTL(cacheKey, JSON.stringify(product), CACHE_TTL);
        await redis.setWithTTL(`product:detail:id:${product.id}`, JSON.stringify(product), CACHE_TTL);
        logger.info(`Redis cache set for: ${cacheKey}`);
      }
    } catch (err) {
      logger.error('Redis write error:', err);
    }

    return product;
  },

  /**
   * Create a new product (Admin, invalidates cache).
   */
  async create(data) {
    const slug = slugify(data.name);

    const existing = await ProductRepository.findBySlug(slug);
    if (existing) {
      throw new ApiError(400, `Product with name or slug '${slug}' already exists`);
    }

    const product = await ProductRepository.create({
      ...data,
      slug
    });

    await this.invalidateCache();
    return product;
  },

  /**
   * Update a product (Admin, invalidates cache).
   */
  async update(id, data) {
    const product = await ProductRepository.findById(id);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    const updateData = { ...data };
    if (data.name) {
      updateData.slug = slugify(data.name);
      
      const existing = await ProductRepository.findBySlug(updateData.slug);
      if (existing && existing.id !== id) {
        throw new ApiError(400, `Product with slug '${updateData.slug}' already exists`);
      }
    }

    const updatedProduct = await ProductRepository.update(id, updateData);

    await this.invalidateCache(id, product.slug);
    return updatedProduct;
  },

  /**
   * Delete a product (Admin, invalidates cache).
   */
  async delete(id) {
    const product = await ProductRepository.findById(id);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    const result = await ProductRepository.delete(id);

    await this.invalidateCache(id, product.slug);
    return result;
  },

  /**
   * Get featured products (cached).
   */
  async getFeatured(limit = 10) {
    const cacheKey = `product:featured:limit:${limit}`;
    try {
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.info(`Redis cache hit for: ${cacheKey}`);
          return JSON.parse(cached);
        }
      }
    } catch (err) {
      logger.error('Redis read error:', err);
    }

    const products = await ProductRepository.findFeatured(limit);

    try {
      if (redis) {
        await redis.setWithTTL(cacheKey, JSON.stringify(products), CACHE_TTL);
      }
    } catch (err) {
      logger.error('Redis write error:', err);
    }

    return products;
  },

  /**
   * Get related products.
   */
  async getRelated(productId, limit = 4) {
    const product = await ProductRepository.findById(productId);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }
    if (!product.categoryId) {
      return [];
    }
    return ProductRepository.findRelated(productId, product.categoryId, limit);
  },

  /**
   * Search products.
   */
  async search(query, limit = 10) {
    return ProductRepository.search(query, limit);
  },

  /**
   * Invalidate Redis cache.
   */
  async invalidateCache(id = null, slug = null) {
    try {
      if (!redis) return;

      logger.info('Invalidating product cache patterns...');
      
      // Invalidate individual keys if provided
      if (id) {
        await redis.del(`product:detail:id:${id}`);
      }
      if (slug) {
        await redis.del(`product:detail:slug:${slug}`);
      }

      // Invalidate list queries, featured lists, etc.
      if (typeof redis.invalidatePattern === 'function') {
        await redis.invalidatePattern('product:list:*');
        await redis.invalidatePattern('product:featured:*');
      } else {
        // Fallback standard del or loop if invalidatePattern isn't fully implemented
        logger.warn('redis.invalidatePattern is not available, cannot wipe wildcard lists.');
      }
    } catch (err) {
      logger.error('Redis cache invalidation error:', err);
    }
  }
};
