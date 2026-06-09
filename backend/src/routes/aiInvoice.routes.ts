import { Router } from 'express';
import * as aiInvoiceController from '../controllers/aiInvoice.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.post('/parse', aiInvoiceController.parseInvoice);
router.get('/insights/:businessId', aiInvoiceController.getInsights);
router.get('/follow-up/:id', aiInvoiceController.generateFollowUpMessage);

export default router;
