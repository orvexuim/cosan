import { prisma } from '../config/database.js';

export const notificationRepository = {
  /**
   * Find notifications for a specific user
   */
  async findByUserId(userId, skip = 0, limit = 50) {
    const [items, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return { items, total };
  },

  /**
   * Create a notification
   */
  async create({ userId, type, title, message, data }) {
    return prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || null,
      },
    });
  },

  /**
   * Mark notification as read
   */
  async markAsRead(id, userId) {
    return prisma.notification.updateMany({
      where: {
        id,
        userId, // ensure ownership
      },
      data: {
        isRead: true,
      },
    });
  },

  /**
   * Mark all notifications for user as read
   */
  async markAllAsRead(userId) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  },

  /**
   * Get total count of unread notifications for a user
   */
  async findUnreadCount(userId) {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  },
};

export default notificationRepository;
