import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Unauthorized: Access token missing'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains id and role
    next();
  } catch (err) {
    next(new ApiError(401, 'Unauthorized: Invalid access token'));
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR')) {
    return next(new ApiError(403, 'Forbidden: Admin access required'));
  }
  next();
};
