import { Router } from 'express';
import * as gstController from '../controllers/gst.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.use(auth);

router.get('/summary', gstController.getGSTSummary);
router.get('/gstr1', gstController.getGSTR1);

export default router;
