import { Router } from 'express';
import * as recurringController from '../controllers/recurringInvoice.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createRecurringSchema,
  updateRecurringSchema,
} from '../validators/recurringInvoice.validator.js';

const router = Router({ mergeParams: true });

router.use(auth);

router.post(
  '/client/:clientId',
  validate(createRecurringSchema),
  recurringController.create
);
router.get('/', recurringController.getAll);
router.get('/:id', recurringController.getById);
router.put('/:id', validate(updateRecurringSchema), recurringController.update);
router.delete('/:id', recurringController.remove);

export default router;
