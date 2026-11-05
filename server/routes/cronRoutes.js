import crypto from 'node:crypto';
import { Router } from 'express';
import { env } from '../config/env.js';
import { AppError, asyncHandler } from '../utils/appError.js';
import { runScheduledJobs } from '../services/scheduler.js';

const router = Router();

const safeEqual = (a, b) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/**
 * Runs the overdue / reminder jobs. Serverless hosts cannot keep a timer alive, so a cron service
 * (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`) calls this endpoint instead.
 */
router.get(
  '/run',
  asyncHandler(async (req, res) => {
    if (!env.CRON_SECRET) throw new AppError('Cron is not configured', 404);
    if (!safeEqual(req.headers.authorization || '', `Bearer ${env.CRON_SECRET}`)) throw new AppError('Unauthorized', 401);
    res.json({ success: true, ...(await runScheduledJobs()) });
  })
);

export default router;
