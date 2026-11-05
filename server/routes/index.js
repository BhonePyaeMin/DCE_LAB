import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import labRoutes from './labRoutes.js';
import equipmentRoutes from './equipmentRoutes.js';
import borrowingRoutes from './borrowingRoutes.js';
import maintenanceRoutes from './maintenanceRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import fileRoutes from './fileRoutes.js';
import cronRoutes from './cronRoutes.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok' }));
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/laboratories', labRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/borrowings', borrowingRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/files', fileRoutes);
router.use('/cron', cronRoutes);

export default router;
