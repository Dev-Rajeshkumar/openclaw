import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createPaymentSchema,
} from '../validators/payment.validator.js';

const router = Router();

router.use(auth);

router.post(
  '/invoice/:invoiceId',
  validate(createPaymentSchema),
  paymentController.create
);
router.get('/', paymentController.getAll);
router.get('/stats', paymentController.getStats);
router.get('/:id', paymentController.getById);
router.delete('/:id', paymentController.remove);

export default router;
