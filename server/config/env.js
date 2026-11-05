import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

if (isProd && (!process.env.JWT_SECRET || !process.env.MONGODB_URI)) {
  throw new Error('JWT_SECRET and MONGODB_URI must be set in production.');
}

export const env = {
  NODE_ENV: nodeEnv,
  isProd,
  isTest: nodeEnv === 'test',
  PORT: Number(process.env.PORT) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  // One or more comma separated browser origins allowed to call the API (the first is used for QR links).
  CLIENT_ORIGINS: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean),
  CRON_SECRET: process.env.CRON_SECRET || '',
  isServerless: Boolean(process.env.VERCEL),
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  SERVER_URL: process.env.SERVER_URL || '',
};

env.CLIENT_URL = env.CLIENT_ORIGINS[0];
env.useCloudinary = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);
