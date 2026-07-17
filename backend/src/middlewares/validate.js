import { ApiError } from '../utils/ApiError.js';

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const dataToValidate = {};
      
      if (schema.body) dataToValidate.body = req.body;
      if (schema.params) dataToValidate.params = req.params;
      if (schema.query) dataToValidate.query = req.query;
      
      // If we provided a full schema object containing body, params, query keys
      if (schema.body || schema.params || schema.query) {
        for (const key of ['body', 'params', 'query']) {
          if (schema[key]) {
            const parsed = schema[key].safeParse(req[key]);
            if (!parsed.success) {
              throw parsed.error;
            }
            req[key] = parsed.data;
          }
        }
      } else {
        // Assume fallback to standard validation of body directly if schema is a direct Zod Object
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
          throw parsed.error;
        }
        req.body = parsed.data;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validate;
