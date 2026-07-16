import { prisma } from '../config/database.js';

export const orderRepository = {
  /**
   * Create an order within a transaction (expects tx to be passed if used within larger flow)
   */
  async create(orderData, itemsData, tx = prisma) {
    return tx.order.create({
      data: {
        ...orderData,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
        shippingAddress: true,
        coupon: true,
      },
    });
  },

  /**
   * Find order by ID
   */
  async findById(id) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        shippingAddress: true,
        coupon: true,
      },
    });
  },

  /**
   * Find orders for a user with simple pagination
   */
  async findByUserId(userId, skip = 0, limit = 10) {
    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        where: { userId },
        include: {
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return { items, total };
  },

  /**
   * Admin: Find all orders with pagination, filtering
   */
  async findAll({ status, paymentStatus, dateFrom, dateTo, skip = 0, limit = 10 }) {
    const where = {};

    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return { items, total };
  },

  /**
   * Update order status
   */
  async updateStatus(id, status) {
    return prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  },

  /**
   * Update payment status
   */
  async updatePaymentStatus(id, paymentStatus) {
    return prisma.order.update({
      where: { id },
      data: { paymentStatus },
    });
  },

  /**
   * Find order by Order Number
   */
  async findByOrderNumber(orderNumber) {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  },

  /**
   * Update tracking information
   */
  async updateTracking(id, { trackingNumber, carrier }) {
    return prisma.order.update({
      where: { id },
      data: {
        trackingNumber,
        carrier,
        status: 'SHIPPED',
      },
    });
  },

  /**
   * Count orders by status
   */
  async countByStatus() {
    const counts = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });

    return counts.reduce((acc, current) => {
      acc[current.status] = current._count._all;
      return acc;
    }, {});
  },

  /**
   * Sum overall revenue
   */
  async sumRevenue(dateFrom, dateTo) {
    const where = {
      status: {
        in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
      },
    };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const aggregation = await prisma.order.aggregate({
      where,
      _sum: {
        totalAmount: true,
      },
    });

    return aggregation._sum.totalAmount || 0;
  },
};

export default orderRepository;
