import { Router } from 'express';
import * as clientPortalController from '../controllers/clientPortal.controller.js';
import { clientAuth } from '../middleware/clientAuth.js';

const router = Router();

// Public auth routes (no auth)
router.post('/auth/magic-link', clientPortalController.sendMagicLink);
router.post('/auth/verify', clientPortalController.verifyMagicLink);

// Protected client routes
router.use(clientAuth);
router.get('/me', clientPortalController.getMyProfile);
router.get('/invoices', clientPortalController.getMyInvoices);
router.get('/invoices/:id', clientPortalController.getMyInvoice);
router.get('/payments', clientPortalController.getMyPayments);

export default router;
