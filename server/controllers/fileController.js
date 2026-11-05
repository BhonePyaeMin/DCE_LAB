import File from '../models/File.js';
import { AppError, asyncHandler } from '../utils/appError.js';

/** Streams a stored image. Public on purpose: it is referenced from <img> tags, and ids are unguessable. */
export const getFile = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id).catch(() => null);
  if (!file) throw new AppError('File not found', 404);
  res.set({
    'Content-Type': file.contentType,
    'Content-Length': file.size,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Cross-Origin-Resource-Policy': 'cross-origin',
  });
  res.send(file.data);
});
