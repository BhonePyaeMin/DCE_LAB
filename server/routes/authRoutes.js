import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as ctrl from '../controllers/authController.js';

const router = Router();

router.post('/register', validate(ctrl.registerSchema), ctrl.register);
router.post('/login', validate(ctrl.loginSchema), ctrl.login);
router.get('/me', protect, ctrl.me);
router.patch('/me', protect, validate(ctrl.profileSchema), ctrl.updateProfile);
router.post('/change-password', protect, validate(ctrl.passwordSchema), ctrl.changePassword);

export default router;
