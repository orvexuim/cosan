import { jest } from '@jest/globals';
import mockPrisma from './helpers/mockDb.js';

// Set NODE_ENV
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'supersecretjwtfortestingcosmanluxurybrand';
process.env.JWT_REFRESH_SECRET = 'refreshsupersecretjwtfortestingcosmanluxurybrand';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/cosman_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.PORT = '5001';

// Mock Modules
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma)
  };
});

// Mock Redis Client
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      setex: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      flushall: jest.fn().mockResolvedValue('OK'),
      quit: jest.fn().mockResolvedValue('OK'),
      on: jest.fn(),
    };
  });
});

jest.mock('redis', () => {
  const mockRedisClient = {
    connect: jest.fn().mockResolvedValue(null),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
  };
  return {
    createClient: jest.fn().mockReturnValue(mockRedisClient)
  };
});

// Mock Nodemailer
jest.mock('nodemailer', () => {
  return {
    createTransport: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-email-id-123' })
    })
  };
});

// Mock Cloudinary
jest.mock('cloudinary', () => {
  return {
    v2: {
      config: jest.fn(),
      uploader: {
        upload: jest.fn().mockResolvedValue({
          secure_url: 'https://cloudinary.com/mock-upload.jpg',
          public_id: 'mock-public-id-789'
        }),
        destroy: jest.fn().mockResolvedValue({ result: 'ok' })
      }
    }
  };
});

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => {
    return {
      paymentIntents: {
        create: jest.fn().mockResolvedValue({
          id: 'pi_mock_stripe_123',
          client_secret: 'pi_mock_stripe_123_secret'
        }),
        retrieve: jest.fn().mockResolvedValue({
          id: 'pi_mock_stripe_123',
          status: 'succeeded'
        })
      }
    };
  });
});

beforeEach(() => {
  jest.clearAllMocks();
});
