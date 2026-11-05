import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate, objectIdParam } from '../middleware/validate.js';
import * as ctrl from '../controllers/borrowingController.js';

const router = Router();
router.param('id', objectIdParam);
router.use(protect);

router.route('/').get(ctrl.listBorrowings).post(validate(ctrl.createBorrowingSchema), ctrl.createBorrowing);
router.patch('/:id/review', authorize('admin'), validate(ctrl.reviewBorrowingSchema), ctrl.reviewBorrowing);
router.patch('/:id/collect', authorize('admin'), ctrl.collectBorrowing);
router.patch('/:id/return', authorize('admin'), validate(ctrl.returnSchema), ctrl.returnBorrowing);
router.patch('/:id/cancel', ctrl.cancelBorrowing);

export default router;
