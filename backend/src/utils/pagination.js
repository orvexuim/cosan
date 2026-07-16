import { prisma } from '../config/database.js';

/**
 * Pagination and Filtering Helper Utility
 */
export const pagination = {
  /**
   * Parse query parameters for standard sorting/pagination parameters
   */
  parseQuery(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const sort = query.sort || 'createdAt';
    const order = query.order === 'asc' ? 'asc' : 'desc';

    return {
      page,
      limit,
      skip,
      sort,
      order,
    };
  },

  /**
   * Run paginated query against a Prisma model
   */
  async paginate(modelName, query = {}, options = {}) {
    const { page, limit, skip, sort, order } = this.parseQuery(query);
    const { where = {}, include = null, select = null } = options;

    const orderBy = {
      [sort]: order,
    };

    const prismaModel = prisma[modelName];
    if (!prismaModel) {
      throw new Error(`Prisma model "${modelName}" does not exist.`);
    }

    const [totalItems, items] = await Promise.all([
      prismaModel.count({ where }),
      prismaModel.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        ...(include && { include }),
        ...(select && { select }),
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  },

  /**
   * Format paginated output directly for responses
   */
  formatResponse(paginatedData) {
    return {
      success: true,
      data: paginatedData.items,
      meta: paginatedData.pagination,
    };
  },
};

export default pagination;
