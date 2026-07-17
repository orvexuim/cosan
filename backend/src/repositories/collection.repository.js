import { prisma } from '../config/database.js';

export const CollectionRepository = {
  /**
   * Find all collections.
   */
  async findAll() {
    return prisma.collection.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  },

  /**
   * Find collection by ID.
   */
  async findById(id) {
    return prisma.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
  },

  /**
   * Find collection by slug.
   */
  async findBySlug(slug) {
    return prisma.collection.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
  },

  /**
   * Create a collection.
   */
  async create(data) {
    return prisma.collection.create({
      data
    });
  },

  /**
   * Update a collection.
   */
  async update(id, data) {
    return prisma.collection.update({
      where: { id },
      data
    });
  },

  /**
   * Delete a collection.
   */
  async delete(id) {
    return prisma.collection.delete({
      where: { id }
    });
  },

  /**
   * Find products associated with this collection.
   */
  async findProducts(collectionId, pagination = { skip: 0, take: 10 }) {
    const productCollections = await prisma.productCollection.findMany({
      where: { collectionId },
      skip: pagination.skip,
      take: pagination.take,
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
            variants: true
          }
        }
      }
    });

    const total = await prisma.productCollection.count({
      where: { collectionId }
    });

    return {
      products: productCollections.map(pc => pc.product),
      total
    };
  }
};
