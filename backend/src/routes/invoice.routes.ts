import { Router } from 'express';
import * as invoiceController from '../controllers/invoice.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  updateInvoiceStatusSchema,
} from '../validators/invoice.validator.js';

const router = Router({ mergeParams: true });

router.use(auth);

router.post('/', validate(createInvoiceSchema), invoiceController.create);
router.get('/', invoiceController.getAll);
router.get('/stats', invoiceController.getStats);
router.get('/:id', invoiceController.getById);
router.put('/:id', validate(updateInvoiceSchema), invoiceController.update);
router.patch(
  '/:id/status',
  validate(updateInvoiceStatusSchema),
  invoiceController.updateStatus
);
router.delete('/:id', invoiceController.remove);

export default router;
