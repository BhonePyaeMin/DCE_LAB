import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate, objectIdParam } from '../middleware/validate.js';
import { imageUpload } from '../middleware/upload.js';
import * as ctrl from '../controllers/equipmentController.js';

const router = Router();
router.param('id', objectIdParam);
router.use(protect);

router.get('/', ctrl.listEquipment);
router.get('/categories', ctrl.categories);
router.get('/code/:code', ctrl.lookupByCode);
router.get('/:id', ctrl.getEquipment);
router.get('/:id/qr', ctrl.qrCode);
router.post('/', authorize('admin'), imageUpload.single('image'), validate(ctrl.createEquipmentSchema), ctrl.createEquipment);
router.patch('/:id', authorize('admin'), imageUpload.single('image'), validate(ctrl.updateEquipmentSchema), ctrl.updateEquipment);
router.delete('/:id', authorize('admin'), ctrl.deleteEquipment);

export default router;
