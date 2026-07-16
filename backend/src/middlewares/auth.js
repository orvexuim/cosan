import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Authenticate JWT token and attach user to request context
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // Read token from Authorization header or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new ApiError(401, 'Authentication required. Please provide a valid token.');
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Fetch user from DB and omit password
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isEmailVerified: true,
        avatar: true,
      },
    });

    if (!user) {
      throw new ApiError(401, 'User associated with this token no longer exists.');
    }

    req.user = user;
    next();
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired access token.');
  }
});

/**
 * Authorize roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required.');
    }
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'Forbidden. You do not have permission to access this resource.');
    }
    next();
  };
};

/**
 * Optional Authentication context (does not block if unauthorized, but populates req.user if token is valid)
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isEmailVerified: true,
        avatar: true,
      },
    });
    if (user) {
      req.user = user;
    }
  } catch (err) {
    // Fail silently since it's optional authentication
  }
  next();
});
