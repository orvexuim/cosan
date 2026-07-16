import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_NAME: z.string().default('COSMAN'),
  APP_URL: z.string().url().default('http://localhost:5000'),
  LOG_LEVEL: z.string().default('info'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('1d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number(),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),
  PAYPAL_CLIENT_ID: z.string(),
  PAYPAL_CLIENT_SECRET: z.string(),
  PAYPAL_MODE: z.enum(['sandbox', 'live']).default('sandbox'),
});

const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Invalid Environment Variables:', JSON.stringify(parsed.error.format(), null, 2));
    throw new Error('Invalid environment variables configuration');
  }
  return parsed.data;
};

const validatedEnv = parseEnv();

export const config = {
  app: {
    port: validatedEnv.PORT,
    env: validatedEnv.NODE_ENV,
    name: validatedEnv.APP_NAME,
    url: validatedEnv.APP_URL,
    logLevel: validatedEnv.LOG_LEVEL,
  },
  database: {
    url: validatedEnv.DATABASE_URL,
  },
  jwt: {
    secret: validatedEnv.JWT_SECRET,
    refreshSecret: validatedEnv.JWT_REFRESH_SECRET,
    expiresIn: validatedEnv.JWT_EXPIRES_IN,
    refreshExpiresIn: validatedEnv.JWT_REFRESH_EXPIRES_IN,
  },
  redis: {
    url: validatedEnv.REDIS_URL,
  },
  cloudinary: {
    cloudName: validatedEnv.CLOUDINARY_CLOUD_NAME,
    apiKey: validatedEnv.CLOUDINARY_API_KEY,
    apiSecret: validatedEnv.CLOUDINARY_API_SECRET,
  },
  email: {
    host: validatedEnv.SMTP_HOST,
    port: validatedEnv.SMTP_PORT,
    user: validatedEnv.SMTP_USER,
    pass: validatedEnv.SMTP_PASS,
  },
  stripe: {
    secretKey: validatedEnv.STRIPE_SECRET_KEY,
    webhookSecret: validatedEnv.STRIPE_WEBHOOK_SECRET,
  },
  paypal: {
    clientId: validatedEnv.PAYPAL_CLIENT_ID,
    clientSecret: validatedEnv.PAYPAL_CLIENT_SECRET,
    mode: validatedEnv.PAYPAL_MODE,
  },
};

export default config;
