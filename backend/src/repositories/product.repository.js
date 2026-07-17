import { prisma } from '../config/database.js';

export const ProductRepository = {
  /**
   * Find product by ID with full details (variants, category, collections).
   */
  async findById(id) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        category: {
          select: { id: true, name: true, slug: true }
        },
        collections: {
          include: {
            collection: {
              select: { id: true, name: true, slug: true }
            }
          }
        }
      }
    });
  },

  /**
   * Find product by slug with full details.
   */
  async findBySlug(slug) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        variants: true,
        category: {
          select: { id: true, name: true, slug: true }
        },
        collections: {
          include: {
            collection: {
              select: { id: true, name: true, slug: true }
            }
          }
        }
      }
    });
  },

  /**
   * Find all products with complex filters, pagination, and sorting.
   */
  async findAll(filters = {}) {
    const {
      search,
      categoryId,
      collectionId,
      minPrice,
      maxPrice,
      sizes = [],
      colors = [],
      sortBy,
      skip = 0,
      take = 10
    } = filters;

    // Build the query where clause
    const where = { isActive: true };

    // Search term matching name/description/tags
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    // Category filter
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Collection filter
    if (collectionId) {
      where.collections = {
        some: {
          collectionId
        }
      };
    }

    // Price range filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    // Variant filter: sizes and colors
    if ((sizes && sizes.length > 0) || (colors && colors.length > 0)) {
      where.variants = {
        some: {
          isActive: true
        }
      };
      if (sizes && sizes.length > 0) {
        where.variants.some.size = { in: sizes };
      }
      if (colors && colors.length > 0) {
        where.variants.some.color = { in: colors, mode: 'insensitive' };
      }
    }

    // Sorting definition
    let orderBy = { createdAt: 'desc' }; // Default is newest
    if (sortBy) {
      switch (sortBy) {
        case 'price_asc':
          orderBy = { price: 'asc' };
          break;
        case 'price_desc':
          orderBy = { price: 'desc' };
          break;
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'rating':
          orderBy = { rating: 'desc' };
          break;
        case 'popular':
          orderBy = { reviewCount: 'desc' };
          break;
      }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: {
            select: { id: true, name: true, slug: true }
          },
          variants: {
            where: { isActive: true }
          },
          collections: {
            include: {
              collection: {
                select: { id: true, name: true, slug: true }
              }
            }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    return { products, total };
  },

  /**
   * Create a new product along with nested variants and collection connections.
   */
  async create(data) {
    const { variants, collections, ...productData } = data;

    return prisma.product.create({
      data: {
        ...productData,
        variants: {
          create: variants || []
        },
        collections: {
          create: (collections || []).map(cid => ({
            collectionId: cid
          }))
        }
      },
      include: {
        variants: true,
        category: {
          select: { id: true, name: true, slug: true }
        },
        collections: {
          include: {
            collection: {
              select: { id: true, name: true, slug: true }
            }
          }
        }
      }
    });
  },

  /**
   * Update a product. Handled safely.
   */
  async update(id, data) {
    const { variants, collections, ...productData } = data;

    // Use a transaction to update product, its collections associations and properties
    return prisma.$transaction(async (tx) => {
      // If collection associations are provided, sync them
      if (collections !== undefined) {
        // Clear existing associations
        await tx.productCollection.deleteMany({
          where: { productId: id }
        });

        // Add new associations
        if (collections.length > 0) {
          await tx.productCollection.createMany({
            data: collections.map(cid => ({
              productId: id,
              collectionId: cid
            }))
          });
        }
      }

      // If variants are provided during product update (e.g., bulk replace/override or addition)
      if (variants !== undefined) {
        // Remove old variants
        await tx.productVariant.deleteMany({
          where: { productId: id }
        });

        // Add new variants
        if (variants.length > 0) {
          await tx.productVariant.createMany({
            data: variants.map(v => ({
              ...v,
              productId: id
            }))
          });
        }
      }

      // Update core product details
      return tx.product.update({
        where: { id },
        data: productData,
        include: {
          variants: true,
          category: {
            select: { id: true, name: true, slug: true }
          },
          collections: {
            include: {
              collection: {
                select: { id: true, name: true, slug: true }
              }
            }
          }
        }
      });
    });
  },

  /**
   * Delete a product. Cascade deletes related variants and collections thanks to database constraints/Prisma.
   */
  async delete(id) {
    return prisma.product.delete({
      where: { id }
    });
  },

  /**
   * Get featured products.
   */
  async findFeatured(limit = 10) {
    return prisma.product.findMany({
      where: {
        isFeatured: true,
        isActive: true
      },
      take: limit,
      include: {
        variants: {
          where: { isActive: true }
        },
        category: {
          select: { id: true, name: true, slug: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  /**
   * Get related products based on category, excluding current product.
   */
  async findRelated(productId, categoryId, limit = 4) {
    return prisma.product.findMany({
      where: {
        categoryId,
        id: { not: productId },
        isActive: true
      },
      take: limit,
      include: {
        variants: {
          where: { isActive: true }
        },
        category: {
          select: { id: true, name: true, slug: true }
        }
      },
      orderBy: { rating: 'desc' }
    });
  },

  /**
   * Update calculated rating and reviewCount.
   */
  async updateRating(id, rating, reviewCount) {
    return prisma.product.update({
      where: { id },
      data: {
        rating,
        reviewCount
      }
    });
  },

  /**
   * Full-text search on name and description using PostgreSQL ILIKE patterns.
   */
  async search(query, limit = 10) {
    return prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } }
        ]
      },
      take: limit,
      include: {
        variants: {
          where: { isActive: true }
        },
        category: {
          select: { id: true, name: true, slug: true }
        }
      }
    });
  }
};
