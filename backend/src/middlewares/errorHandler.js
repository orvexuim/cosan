import { ApiError } from './ApiError.js';

export const errorHandler = (err, req, res, next) => {
  let { statusCode, message, errors } = err;

  // Set defaults if not specified or unrecognized
  if (!statusCode) {
    statusCode = 500;
  }
  if (!message) {
    message = 'Internal Server Error';
  }
  if (!errors) {
    errors = [];
  }

  // Handle Prisma Database Errors
  if (err.code) {
    switch (err.code) {
      case 'P2002': // Unique constraint violation
        statusCode = 400;
        message = `Unique constraint failed on field: ${err.meta?.target || 'unknown'}`;
        break;
      case 'P2025': // Record not found
        statusCode = 404;
        message = err.meta?.cause || 'Record not found';
        break;
      case 'P2003': // Foreign key constraint violation
        statusCode = 400;
        message = `Foreign key constraint failed on field: ${err.meta?.field_name || 'unknown'}`;
        break;
      default:
        statusCode = 400;
        message = `Database Error: ${err.message}`;
    }
  }

  // Handle Zod Validation Errors
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your token has expired. Please log in again.';
  }

  const response = {
    statusCode,
    success: false,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

export default errorHandler;
