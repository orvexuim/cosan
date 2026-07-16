import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import config from './env.js';

const prismaClientSingleton = () => {
  const prisma = new PrismaClient({
    log: config.app.env === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });

  prisma.$on('query', (e) => {
    logger.debug(`Prisma Query: ${e.query} - Params: ${e.params} - Duration: ${e.duration}ms`);
  });

  return prisma;
};

// Global object to prevent multiple instances of Prisma Client during hot reloading in dev
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prismaGlobal ?? prismaClientSingleton();

if (config.app.env !== 'production') {
  globalForPrisma.prismaGlobal = prisma;
}

export const connectDb = async () => {
  try {
    await prisma.$connect();
    logger.info('🐘 PostgreSQL Database connected successfully via Prisma ORM.');
  } catch (error) {
    logger.error('❌ Failed to connect to PostgreSQL Database:', error);
    process.exit(1);
  }
};

export const disconnectDb = async () => {
  try {
    await prisma.$disconnect();
    logger.info('🐘 PostgreSQL Prisma connection closed gracefully.');
  } catch (error) {
    logger.error('❌ Error shutting down Prisma connection:', error);
  }
};

export default prisma;
