import { Router } from 'express';
import { invoiceController } from '../controllers/invoice.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  getInvoiceSchema,
  listInvoicesSchema,
  recordPaymentSchema,
} from '../validators/invoice.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Dashboard stats (must be before /:id routes)
router.get(
  '/dashboard/stats',
  invoiceController.getDashboardStats.bind(invoiceController)
);

router.post(
  '/',
  validate(createInvoiceSchema),
  invoiceController.create.bind(invoiceController)
);

router.get(
  '/',
  validate(listInvoicesSchema),
  invoiceController.list.bind(invoiceController)
);

router.get(
  '/:id',
  validate(getInvoiceSchema),
  invoiceController.getById.bind(invoiceController)
);

router.put(
  '/:id',
  validate(updateInvoiceSchema),
  invoiceController.update.bind(invoiceController)
);

router.delete(
  '/:id',
  validate(getInvoiceSchema),
  invoiceController.delete.bind(invoiceController)
);

router.post(
  '/:id/payments',
  validate(recordPaymentSchema),
  invoiceController.recordPayment.bind(invoiceController)
);

export default router;
