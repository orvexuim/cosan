import { ApiError } from '../utils/ApiError.js';

export const notFound = (req, res, next) => {
  next(new ApiError(404, `Cannot find ${req.method} ${req.originalUrl} on this server`));
};

export default notFound;
