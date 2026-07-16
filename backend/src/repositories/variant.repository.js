import { prisma } from '../config/database.js';

export const VariantRepository = {
  /**
   * Find variants by product ID.
   */
  async findByProductId(productId) {
    return prisma.productVariant.findMany({
      where: { productId },
      orderBy: { size: 'asc' }
    });
  },

  /**
   * Find variant by ID.
   */
  async findById(id) {
    return prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: true
      }
    });
  },

  /**
   * Create a variant.
   */
  async create(data) {
    return prisma.productVariant.create({
      data
    });
  },

  /**
   * Update a variant.
   */
  async update(id, data) {
    return prisma.productVariant.update({
      where: { id },
      data
    });
  },

  /**
   * Delete a variant.
   */
  async delete(id) {
    return prisma.productVariant.delete({
      where: { id }
    });
  },

  /**
   * Bulk create variants.
   */
  async bulkCreate(variants) {
    return prisma.productVariant.createMany({
      data: variants
    });
  },

  /**
   * Check stock of a variant.
   */
  async checkStock(id) {
    const variant = await prisma.productVariant.findUnique({
      where: { id },
      select: { stock: true }
    });
    return variant ? variant.stock : 0;
  },

  /**
   * Decrease stock by a certain amount.
   */
  async decreaseStock(id, amount) {
    return prisma.productVariant.update({
      where: { id },
      data: {
        stock: {
          decrement: amount
        }
      }
    });
  },

  /**
   * Increase stock by a certain amount.
   */
  async increaseStock(id, amount) {
    return prisma.productVariant.update({
      where: { id },
      data: {
        stock: {
          increment: amount
        }
      }
    });
  }
};
