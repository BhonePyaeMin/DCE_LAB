import mongoose from 'mongoose';
import { AppError } from '../utils/appError.js';

/** Validates req[source] against a zod schema and replaces it with the parsed value. */
export const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      const first = details[0];
      return next(
        new AppError(first ? `${first.field ? `${first.field}: ` : ''}${first.message}` : 'Invalid input', 400, details)
      );
    }
    req[source] = result.data;
    next();
  };

/** router.param handler: rejects malformed ObjectIds with a 400 instead of a cast error. */
export const objectIdParam = (req, _res, next, value) => {
  if (!mongoose.isValidObjectId(value)) return next(new AppError('Invalid id', 400));
  next();
};

/** Removes keys that could be interpreted as MongoDB operators from user input. */
export function sanitizeInput(req, _res, next) {
  const clean = (value) => {
    if (Array.isArray(value)) return value.forEach(clean);
    if (value && typeof value === 'object') {
      for (const key of Object.keys(value)) {
        if (key.startsWith('$') || key.includes('.')) delete value[key];
        else clean(value[key]);
      }
    }
  };
  clean(req.body);
  clean(req.query);
  clean(req.params);
  next();
}
