import { prisma } from '../config/database.js';

export const userRepository = {
  /**
   * Find a user by ID
   * @param {string} id 
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  /**
   * Find a user by Email
   * @param {string} email 
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  /**
   * Create a new user
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async create(data) {
    return prisma.user.create({
      data,
    });
  },

  /**
   * Update user details
   * @param {string} id 
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  /**
   * Update user password
   * @param {string} id 
   * @param {string} hashedPassword 
   * @returns {Promise<Object>}
   */
  async updatePassword(id, hashedPassword) {
    return prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
      },
    });
  },

  /**
   * Set reset password token and expiry
   * @param {string} email 
   * @param {string|null} token 
   * @param {Date|null} expiresAt 
   * @returns {Promise<Object>}
   */
  async setResetToken(email, token, expiresAt) {
    return prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: token,
        resetPasswordExpiresAt: expiresAt,
      },
    });
  },

  /**
   * Find a user by reset password token
   * @param {string} token 
   * @returns {Promise<Object|null>}
   */
  async findByResetToken(token) {
    return prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiresAt: {
          gt: new Date(),
        },
      },
    });
  },

  /**
   * Verify a user's email
   * @param {string} id 
   * @returns {Promise<Object>}
   */
  async verifyEmail(id) {
    return prisma.user.update({
      where: { id },
      data: {
        isEmailVerified: true,
      },
    });
  },

  /**
   * Set user refresh token
   * @param {string} id 
   * @param {string|null} refreshToken 
   * @returns {Promise<Object>}
   */
  async setRefreshToken(id, refreshToken) {
    return prisma.user.update({
      where: { id },
      data: {
        refreshToken,
      },
    });
  },

  /**
   * Find user by ID including their addresses
   * @param {string} id 
   * @returns {Promise<Object|null>}
   */
  async findByIdWithAddresses(id) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        addresses: true,
      },
    });
  },

  /**
   * Soft delete a user (In standard Prisma without softdelete extension we can clear fields or delete directly.
   * This project has actual cascade deletes configured on relational models. We delete the user directly).
   * @param {string} id 
   * @returns {Promise<Object>}
   */
  async softDelete(id) {
    return prisma.user.delete({
      where: { id },
    });
  },

  /**
   * Find all users with pagination
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async findAllWithPagination({ page = 1, limit = 10, search = '' }) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
};

export default userRepository;
