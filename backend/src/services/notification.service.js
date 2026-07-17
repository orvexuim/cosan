import { notificationRepository } from '../repositories/notification.repository.js';
import { prisma } from '../config/database.js';

export const notificationService = {
  /**
   * Fetch authenticated user notifications
   */
  async getUserNotifications(userId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    return notificationRepository.findByUserId(userId, skip, limit);
  },

  /**
   * Create and persist a new notification
   */
  async createNotification({ userId, type, title, message, data }) {
    return notificationRepository.create({ userId, type, title, message, data });
  },

  /**
   * Mark single notification as read
   */
  async markAsRead(id, userId) {
    await notificationRepository.markAsRead(id, userId);
    return { success: true, message: 'Notification marked as read' };
  },

  /**
   * Mark all user notifications as read
   */
  async markAllAsRead(userId) {
    await notificationRepository.markAllAsRead(userId);
    return { success: true, message: 'All notifications marked as read' };
  },

  /**
   * Fetch total unread notifications count
   */
  async getUnreadCount(userId) {
    const count = await notificationRepository.findUnreadCount(userId);
    return { unreadCount: count };
  },

  /**
   * Create system/low stock alerts for admins
   */
  async triggerAdminLowStockAlert(variantId, currentStock, minLimit = 5) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant) return;

    // Fetch all admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    for (const admin of admins) {
      await notificationRepository.create({
        userId: admin.id,
        type: 'LOW_STOCK_ALERT',
        title: '⚠️ Low Stock Alert',
        message: `Product variant "${variant.product.name}" (${variant.size} - ${variant.color}) is low on stock! Remaining: ${currentStock}`,
        data: { variantId, productId: variant.productId, currentStock },
      });
    }
  },
};

export default notificationService;
