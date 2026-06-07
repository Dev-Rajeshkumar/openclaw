import { Router } from 'express';
import * as statusLogController from '../controllers/statusLog.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.get('/my', statusLogController.getMyLogs);
router.get('/entity/:entity/:entityId', statusLogController.getEntityLogs);

export default router;
