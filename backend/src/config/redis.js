import Redis from 'ioredis';
import { logger } from '../utils/logger.js';
import config from './env.js';

let redisClient;

try {
  redisClient = new Redis(config.redis.url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    reconnectOnError: (err) => {
      logger.error('Redis reconnectOnError:', err);
      return true;
    },
  });

  redisClient.on('connect', () => {
    logger.info('🚀 Redis connection established.');
  });

  redisClient.on('ready', () => {
    logger.info('🚀 Redis client ready.');
  });

  redisClient.on('error', (err) => {
    logger.error('❌ Redis Connection Error:', err);
  });

  redisClient.on('end', () => {
    logger.warn('⚠️ Redis connection ended.');
  });
} catch (error) {
  logger.error('❌ Redis Initialization Failed:', error);
}

export const cache = {
  /**
   * Get a cached key
   */
  async get(key) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set a cached key with custom or default expiration
   */
  async set(key, value, ttlSeconds = 3600) {
    try {
      const stringValue = JSON.stringify(value);
      if (ttlSeconds) {
        await redisClient.set(key, stringValue, 'EX', ttlSeconds);
      } else {
        await redisClient.set(key, stringValue);
      }
      return true;
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Delete a cached key
   */
  async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Set a cached key with an explicit TTL
   */
  async setWithTTL(key, value, ttlSeconds) {
    return this.set(key, value, ttlSeconds);
  },

  /**
   * Invalidate cache matching a wildcard pattern (e.g. "products:*")
   */
  async invalidatePattern(pattern) {
    try {
      let cursor = '0';
      let keys = [];
      do {
        const reply = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = reply[0];
        keys = reply[1];
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } while (cursor !== '0');
      logger.info(`Redis invalidated keys matching pattern: ${pattern}`);
      return true;
    } catch (error) {
      logger.error(`Redis scan/delete pattern error for ${pattern}:`, error);
      return false;
    }
  },
};

export { redisClient };
export default redisClient;
