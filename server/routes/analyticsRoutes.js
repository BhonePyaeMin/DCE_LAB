import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/analyticsController.js';

const router = Router();
router.use(protect);

router.get('/dashboard', ctrl.dashboard);
router.get('/reports', authorize('admin', 'lecturer', 'assistant'), ctrl.reports);
router.get('/reports/export/:type', authorize('admin'), ctrl.exportCsv);

export default router;
