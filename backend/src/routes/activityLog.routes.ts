import { Router } from 'express';
import * as activityLogController from '../controllers/activityLog.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.get('/my', activityLogController.getMyLogs);
router.get('/entity/:entity/:entityId', activityLogController.getEntityLogs);

export default router;
