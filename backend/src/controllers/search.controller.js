import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/ApiResponse.js';
import { prisma } from '../config/database.js';

export const search = asyncHandler(async (req, res) => {
  const { q, type = 'all', limit = 20, page = 1 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const searchQuery = q?.trim();

  if (!searchQuery) {
    return successResponse(res, { data: { results: [], total: 0 }, message: 'Search query required' });
  }

  const results = {};

  if (type === 'all' || type === 'products') {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
          { brand: { contains: searchQuery, mode: 'insensitive' } },
          { tags: { has: searchQuery } },
        ],
      },
      include: { category: true, variants: true },
      take: parseInt(limit),
      skip,
      orderBy: { rating: 'desc' },
    });
    results.products = products;
  }

  if (type === 'all' || type === 'categories') {
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
      take: parseInt(limit),
    });
    results.categories = categories;
  }

  if (type === 'all' || type === 'collections') {
    const collections = await prisma.collection.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
      take: parseInt(limit),
    });
    results.collections = collections;
  }

  const total = Object.values(results).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
  return successResponse(res, { data: { results, total, query: searchQuery }, message: 'Search completed' });
});
