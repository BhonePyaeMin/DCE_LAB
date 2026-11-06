import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate, objectIdParam } from '../middleware/validate.js';
import { STAFF_ROLES } from '../utils/constants.js';
import * as ctrl from '../controllers/borrowingController.js';
import * as counter from '../controllers/counterController.js';

const router = Router();
router.param('id', objectIdParam);
router.use(protect);

router.get('/calendar', validate(ctrl.calendarQuerySchema, 'query'), ctrl.calendar);
router.get('/counter/students', authorize(...STAFF_ROLES), validate(counter.counterQuerySchema, 'query'), counter.students);
router.get('/counter/items', authorize(...STAFF_ROLES), validate(counter.counterQuerySchema, 'query'), counter.items);
router.post('/counter', authorize(...STAFF_ROLES), validate(counter.counterBorrowSchema), counter.borrow);
router.get('/transactions/:id', counter.getTransaction);
router.route('/').get(ctrl.listBorrowings).post(validate(ctrl.createBorrowingSchema), ctrl.createBorrowing);
router.patch('/:id/review', authorize(...STAFF_ROLES), validate(ctrl.reviewBorrowingSchema), ctrl.reviewBorrowing);
router.patch('/:id/collect', authorize(...STAFF_ROLES), ctrl.collectBorrowing);
router.patch('/:id/return', authorize(...STAFF_ROLES), validate(ctrl.returnSchema), ctrl.returnBorrowing);
router.patch('/:id/cancel', ctrl.cancelBorrowing);

export default router;
