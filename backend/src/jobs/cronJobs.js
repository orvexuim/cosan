import cron from 'node-cron';
import { prisma } from '../config/database.js';
import { notificationService } from '../services/notification.service.js';
import { logger } from '../utils/logger.js';

export function startCronJobs() {
  // Every hour: check for low stock variants
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Running low stock check...');
      const lowStockVariants = await prisma.productVariant.findMany({
        where: { stock: { lte: 5 }, isActive: true },
        include: { product: true },
      });

      for (const variant of lowStockVariants) {
        await notificationService.triggerAdminLowStockAlert(variant.id, variant.stock, 5);
      }

      logger.info(`Low stock check complete: ${lowStockVariants.length} variants with low stock`);
    } catch (error) {
      logger.error('Low stock check failed:', error);
    }
  });

  // Daily at midnight: deactivate expired coupons
  cron.schedule('0 0 * * *', async () => {
    try {
      logger.info('Running expired coupon cleanup...');
      const result = await prisma.coupon.updateMany({
        where: {
          validUntil: { lt: new Date() },
          isActive: true,
        },
        data: { isActive: false },
      });
      logger.info(`Deactivated ${result.count} expired coupons`);
    } catch (error) {
      logger.error('Coupon cleanup failed:', error);
    }
  });

  // Daily at 6am: generate sales summary for admins
  cron.schedule('0 6 * * *', async () => {
    try {
      logger.info('Generating daily sales summary...');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: yesterday, lt: today },
          paymentStatus: 'PAID',
        },
        select: { totalAmount: true, id: true },
      });

      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });

      for (const admin of admins) {
        await notificationService.createNotification({
          userId: admin.id,
          type: 'DAILY_SUMMARY',
          title: 'Daily Sales Summary',
          message: `${orders.length} orders processed yesterday. Total revenue: $${totalRevenue.toFixed(2)}`,
          data: { orderCount: orders.length, totalRevenue },
        });
      }
      logger.info('Daily sales summary sent');
    } catch (error) {
      logger.error('Sales summary failed:', error);
    }
  });

  // Weekly on Monday at 8am: send restock reminder
  cron.schedule('0 8 * * 1', async () => {
    try {
      logger.info('Running weekly restock reminder...');
      const outOfStock = await prisma.productVariant.findMany({
        where: { stock: 0, isActive: true },
        include: { product: true },
      });

      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        await notificationService.createNotification({
          userId: admin.id,
          type: 'RESTOCK_REMINDER',
          title: 'Weekly Restock Reminder',
          message: `${outOfStock.length} variants are out of stock and need restocking.`,
          data: { outOfStockCount: outOfStock.length, items: outOfStock.map(v => ({ product: v.product.name, sku: v.sku, size: v.size, color: v.color })) },
        });
      }
      logger.info(`Restock reminder sent: ${outOfStock.length} items out of stock`);
    } catch (error) {
      logger.error('Restock reminder failed:', error);
    }
  });

  logger.info('Cron jobs initialized');
}
