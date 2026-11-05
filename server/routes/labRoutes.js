import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate, objectIdParam } from '../middleware/validate.js';
import { imageUpload } from '../middleware/upload.js';
import * as ctrl from '../controllers/labController.js';

const router = Router();
router.param('id', objectIdParam);
router.use(protect);

router.get('/', ctrl.listLabs);
router.get('/:id', ctrl.getLab);
router.post('/', authorize('admin'), imageUpload.single('image'), validate(ctrl.createLabSchema), ctrl.createLab);
router.patch('/:id', authorize('admin'), imageUpload.single('image'), validate(ctrl.updateLabSchema), ctrl.updateLab);
router.delete('/:id', authorize('admin'), ctrl.deleteLab);

export default router;
