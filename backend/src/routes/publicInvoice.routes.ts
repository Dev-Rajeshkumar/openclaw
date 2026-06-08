import { Router } from 'express';
import * as publicInvoiceController from '../controllers/publicInvoice.controller.js';

const router = Router();

// Public routes — no auth required
router.get('/:token', publicInvoiceController.getPublicInvoice);
router.get('/:token/pdf', publicInvoiceController.getPublicInvoicePDF);

export default router;
