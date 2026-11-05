import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';
import File from '../models/File.js';
import { AppError } from '../utils/appError.js';

export const UPLOAD_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

// Confirms the file content really is the image type the client claimed.
function matchesSignature(buffer, mimetype) {
  const hex = buffer.subarray(0, 12).toString('hex');
  switch (mimetype) {
    case 'image/jpeg':
      return hex.startsWith('ffd8ff');
    case 'image/png':
      return hex.startsWith('89504e470d0a1a0a');
    case 'image/gif':
      return hex.startsWith('474946383761') || hex.startsWith('474946383961');
    case 'image/webp':
      return hex.startsWith('52494646') && hex.slice(16, 24) === '57454250';
    default:
      return false;
  }
}

/** Stores an uploaded image (Cloudinary when configured, local disk otherwise) and returns its URL. */
export async function storeImage(file) {
  if (!file) return undefined;
  if (!matchesSignature(file.buffer, file.mimetype)) {
    throw new AppError('Uploaded file is not a valid image', 400);
  }

  if (env.useCloudinary) {
    const { v2: cloudinary } = await import('cloudinary');
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: 'dce-lab', resource_type: 'image' }, (err, result) =>
        err ? reject(err) : resolve(result.secure_url)
      );
      stream.end(file.buffer);
    });
  }

  // Production hosts (e.g. Vercel) have no writable disk, so images go into MongoDB and are served by /api/files.
  if (env.isProd) {
    const stored = await File.create({ data: file.buffer, contentType: file.mimetype, size: file.size });
    return `${env.SERVER_URL}/api/files/${stored._id}`;
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${crypto.randomUUID()}.${EXTENSIONS[file.mimetype]}`;
  await fs.writeFile(path.join(UPLOAD_DIR, filename), file.buffer);
  return `${env.SERVER_URL}/uploads/${filename}`;
}

export const storeImages = (files = []) => Promise.all(files.map(storeImage));
