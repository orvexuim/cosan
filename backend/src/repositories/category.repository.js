import { prisma } from '../config/database.js';

export const CategoryRepository = {
  /**
   * Find all categories with basic fields, supporting raw list.
   */
  async findAll() {
    return prisma.category.findMany({
      include: {
        parent: {
          select: { id: true, name: true, slug: true }
        },
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  },

  /**
   * Find category by ID.
   */
  async findById(id) {
    return prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, name: true, slug: true }
        },
        children: true,
        _count: {
          select: { products: true }
        }
      }
    });
  },

  /**
   * Find category by slug.
   */
  async findBySlug(slug) {
    return prisma.category.findUnique({
      where: { slug },
      include: {
        parent: {
          select: { id: true, name: true, slug: true }
        },
        children: true,
        _count: {
          select: { products: true }
        }
      }
    });
  },

  /**
   * Create a new category.
   */
  async create(data) {
    return prisma.category.create({
      data,
      include: {
        parent: {
          select: { id: true, name: true, slug: true }
        }
      }
    });
  },

  /**
   * Update a category.
   */
  async update(id, data) {
    return prisma.category.update({
      where: { id },
      data,
      include: {
        parent: {
          select: { id: true, name: true, slug: true }
        }
      }
    });
  },

  /**
   * Delete a category.
   */
  async delete(id) {
    return prisma.category.delete({
      where: { id }
    });
  },

  /**
   * Find all subcategories for a given parent category ID.
   */
  async findSubcategories(parentId) {
    return prisma.category.findMany({
      where: { parentId },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  },

  /**
   * Get recursive categories to build a full hierarchical category tree.
   */
  async findTree() {
    // Fetch all categories first and build the hierarchy in-memory for accuracy and clean structure
    const allCategories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const categoryMap = {};
    allCategories.forEach(cat => {
      categoryMap[cat.id] = { ...cat, children: [] };
    });

    const rootCategories = [];
    allCategories.forEach(cat => {
      const mapped = categoryMap[cat.id];
      if (cat.parentId) {
        const parent = categoryMap[cat.parentId];
        if (parent) {
          parent.children.push(mapped);
        } else {
          // If parent doesn't exist anymore/orphaned, treat as root
          rootCategories.push(mapped);
        }
      } else {
        rootCategories.push(mapped);
      }
    });

    return rootCategories;
  }
};
