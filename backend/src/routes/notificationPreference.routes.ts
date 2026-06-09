import { Router } from 'express';
import * as ctrl from '../controllers/notificationPreference.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();
router.use(auth);
router.get('/', ctrl.get);
router.put('/', ctrl.update);

export default router;
