import { Router } from 'express';
import { objectIdParam } from '../middleware/validate.js';
import { getFile } from '../controllers/fileController.js';

const router = Router();
router.param('id', objectIdParam);
router.get('/:id', getFile);

export default router;
