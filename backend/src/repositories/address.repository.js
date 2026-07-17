import { prisma } from '../config/database.js';

export const addressRepository = {
  /**
   * Find all addresses for a specific user
   * @param {string} userId 
   * @returns {Promise<Array>}
   */
  async findByUserId(userId) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Find a specific address by ID
   * @param {string} id 
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return prisma.address.findUnique({
      where: { id },
    });
  },

  /**
   * Find a user's address by User ID and Address ID
   * @param {string} userId 
   * @param {string} id 
   * @returns {Promise<Object|null>}
   */
  async findByUserIdAndId(userId, id) {
    return prisma.address.findFirst({
      where: { id, userId },
    });
  },

  /**
   * Create a new address for a user
   * @param {string} userId 
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async create(userId, data) {
    // If setting as default, unset others first
    if (data.isDefault) {
      await this.setDefault(userId, null); // null will unset all, then we set this one
    }

    // Check if user has any address. If not, make this default anyway
    const existingCount = await prisma.address.count({ where: { userId } });
    const isDefault = existingCount === 0 ? true : !!data.isDefault;

    return prisma.address.create({
      data: {
        ...data,
        userId,
        isDefault,
      },
    });
  },

  /**
   * Update an existing address
   * @param {string} id 
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    const address = await this.findById(id);
    if (!address) return null;

    if (data.isDefault && !address.isDefault) {
      await this.setDefault(address.userId, id);
    }

    return prisma.address.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete an address
   * @param {string} id 
   * @returns {Promise<Object>}
   */
  async delete(id) {
    const address = await this.findById(id);
    if (!address) return null;

    const deleted = await prisma.address.delete({
      where: { id },
    });

    // If we deleted the default address, make the most recent one default
    if (deleted.isDefault) {
      const remaining = await prisma.address.findFirst({
        where: { userId: deleted.userId },
        orderBy: { createdAt: 'desc' },
      });
      if (remaining) {
        await prisma.address.update({
          where: { id: remaining.id },
          data: { isDefault: true },
        });
      }
    }

    return deleted;
  },

  /**
   * Set a specific address as default, unsetting all other default addresses for that user
   * @param {string} userId 
   * @param {string|null} defaultAddressId 
   * @returns {Promise<void>}
   */
  async setDefault(userId, defaultAddressId) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    if (defaultAddressId) {
      await prisma.address.update({
        where: { id: defaultAddressId },
        data: { isDefault: true },
      });
    }
  }
};

export default addressRepository;
