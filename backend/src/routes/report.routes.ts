import { Router } from 'express';
import * as reportController from '../controllers/report.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.use(auth);

router.get('/summary', reportController.getSummary);
router.get('/export', reportController.exportData);

export default router;
