import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import swaggerUi from 'swagger-ui-express';

import config from './config/env.js';
import { logger } from './utils/logger.js';
import { connectDb, disconnectDb } from './config/database.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { swaggerSpec, generateSwaggerJson } from './utils/swagger.js';
import router from './routes/index.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { startCronJobs } from './jobs/cronJobs.js';

const app = express();

// Set security headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: config.app.env === 'production' ? config.app.url : '*',
  credentials: true,
}));

// Compression middleware
app.use(compression());

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Parse cookie headers
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Request logging
if (config.app.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));
}

// Rate Limiting
app.use('/api', apiLimiter);

// Swagger Documentation Route
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    environment: config.app.env,
    appName: config.app.name,
  });
});

// Main Route Mounting
app.use('/api/v1', router);

// Handle 404
app.use(notFound);

// Handle Errors
app.use(errorHandler);

// Database initialization
connectDb().then(() => {
  // Generate Swagger JSON file during launch
  try {
    generateSwaggerJson();
  } catch (error) {
    logger.error('Failed to auto-generate swagger.json file', error);
  }
});

const server = app.listen(config.app.port, () => {
  logger.info(`✨ Server running in ${config.app.env} mode on port ${config.app.port}`);
  logger.info(`📖 API Docs available at ${config.app.url}/api/docs`);
  startCronJobs();
});

// Graceful Shutdown
const handleGracefulShutdown = async (signal) => {
  logger.info(`⚠️ Received ${signal}. Initiating graceful shutdown...`);
  
  server.close(async () => {
    logger.info('🛑 Express server stopped accepting new requests.');
    await disconnectDb();
    logger.info('👋 Graceful shutdown complete. Exiting process.');
    process.exit(0);
  });

  // Force close after 10s timeout
  setTimeout(() => {
    logger.error('❌ Shutdown timed out! Forcing exit.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

export default app;
