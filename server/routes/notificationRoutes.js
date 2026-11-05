import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { objectIdParam } from '../middleware/validate.js';
import * as ctrl from '../controllers/notificationController.js';

const router = Router();
router.param('id', objectIdParam);
router.use(protect);

router.get('/', ctrl.listNotifications);
router.patch('/read-all', ctrl.markAllRead);
router.patch('/:id/read', ctrl.markRead);
router.delete('/:id', ctrl.removeNotification);

export default router;
