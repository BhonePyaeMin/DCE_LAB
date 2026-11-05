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
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  // Offset of the laboratory's local time from UTC, used for opening-hour checks (default UTC+7).
  LAB_UTC_OFFSET_MINUTES: Number(process.env.LAB_UTC_OFFSET_MINUTES ?? 420),
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  SERVER_URL: process.env.SERVER_URL || '',
};

env.useCloudinary = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);
