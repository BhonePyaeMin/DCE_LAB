import multer from 'multer';
import { AppError } from '../utils/appError.js';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 3 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(new AppError('Only JPEG, PNG, WebP or GIF images are allowed', 400));
    }
    cb(null, true);
  },
});
