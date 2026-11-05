import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate, objectIdParam } from '../middleware/validate.js';
import { imageUpload } from '../middleware/upload.js';
import * as ctrl from '../controllers/maintenanceController.js';

const router = Router();
router.param('id', objectIdParam);
router.use(protect);

router
  .route('/')
  .get(ctrl.listMaintenance)
  .post(imageUpload.array('images', 3), validate(ctrl.createMaintenanceSchema), ctrl.createMaintenance);
router.get('/:id', ctrl.getMaintenance);
router.patch('/:id', authorize('admin'), validate(ctrl.updateMaintenanceSchema), ctrl.updateMaintenance);

export default router;
