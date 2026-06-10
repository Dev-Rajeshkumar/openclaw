import { Router } from 'express';
import * as reminderScheduleController from '../controllers/reminderSchedule.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.use(auth);

router.get('/', reminderScheduleController.getSchedule);
router.put('/', reminderScheduleController.updateSchedule);

export default router;
