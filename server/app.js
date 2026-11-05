import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.js';
import { sanitizeInput } from './middleware/validate.js';
import { UPLOAD_DIR } from './services/storage.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(sanitizeInput);

const limiter = (windowMs, limit, message) =>
  rateLimit({ windowMs, limit, standardHeaders: 'draft-7', legacyHeaders: false, skip: () => env.isTest, message: { success: false, message } });

app.use('/api', limiter(15 * 60 * 1000, 600, 'Too many requests, please try again later'));
app.use('/api/auth/login', limiter(15 * 60 * 1000, 20, 'Too many login attempts, please try again in 15 minutes'));
app.use('/api/auth/register', limiter(60 * 60 * 1000, 20, 'Too many registrations from this address, please try again later'));

app.use(
  '/uploads',
  express.static(UPLOAD_DIR, {
    index: false,
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  })
);
// Built-in illustrations used by the demo data (user uploads live under /uploads).
app.use(
  '/assets',
  express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), 'public'), {
    index: false,
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  })
);
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
