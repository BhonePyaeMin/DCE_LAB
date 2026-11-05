import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate, objectIdParam } from '../middleware/validate.js';
import * as ctrl from '../controllers/userController.js';

const router = Router();
router.param('id', objectIdParam);
router.use(protect, authorize('admin'));

router.get('/activity-logs', ctrl.listActivityLogs);
router.route('/').get(ctrl.listUsers).post(validate(ctrl.createUserSchema), ctrl.createUser);
router.route('/:id').patch(validate(ctrl.updateUserSchema), ctrl.updateUser).delete(ctrl.deleteUser);

export default router;
