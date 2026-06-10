import { Router } from 'express';
import * as gdprController from '../controllers/gdpr.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth);

// GDPR: Export all user data
router.get('/export', gdprController.exportData);

// GDPR: Delete account and all data
router.delete('/account', gdprController.deleteAccount);

export default router;
