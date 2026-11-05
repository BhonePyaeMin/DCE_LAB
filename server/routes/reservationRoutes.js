import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate, objectIdParam } from '../middleware/validate.js';
import * as ctrl from '../controllers/reservationController.js';

const router = Router();
router.param('id', objectIdParam);
router.use(protect);

router.get('/schedule', validate(ctrl.scheduleQuerySchema, 'query'), ctrl.schedule);
router.route('/').get(ctrl.listReservations).post(validate(ctrl.createReservationSchema), ctrl.createReservation);
router.patch('/:id/review', authorize('admin', 'lecturer'), validate(ctrl.reviewSchema), ctrl.reviewReservation);
router.patch('/:id/cancel', ctrl.cancelReservation);

export default router;
