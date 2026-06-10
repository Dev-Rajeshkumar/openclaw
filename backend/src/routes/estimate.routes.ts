import { Router } from 'express';
import * as estimateController from '../controllers/estimate.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createEstimateSchema,
  updateEstimateSchema,
  updateEstimateStatusSchema,
} from '../validators/estimate.validator.js';

const router = Router({ mergeParams: true });

router.use(auth);

router.post(
  '/client/:clientId',
  validate(createEstimateSchema),
  estimateController.create
);
router.get('/', estimateController.getAll);
router.get('/:id', estimateController.getById);
router.put('/:id', validate(updateEstimateSchema), estimateController.update);
router.patch(
  '/:id/status',
  validate(updateEstimateStatusSchema),
  estimateController.updateStatus
);
router.post('/:id/convert', estimateController.convertToInvoice);
router.delete('/:id', estimateController.remove);

// Bulk operations
router.post('/bulk/status', estimateController.bulkUpdateStatus);
router.post('/bulk/delete', estimateController.bulkDelete);

export default router;
