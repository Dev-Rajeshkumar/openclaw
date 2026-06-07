import { Router } from 'express';
import { businessController } from '../controllers/business.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate, requireBusiness } from '../middleware/auth.js';
import { autoActivityLogger } from '../middleware/activityLogger.js';
import {
  createBusinessSchema,
  updateBusinessSchema,
  getBusinessSchema,
  updatePlanSchema,
} from '../validators/business.validator.js';

const router = Router();
router.use(authenticate);

router.post(
  '/',
  validate(createBusinessSchema),
  autoActivityLogger,
  businessController.create.bind(businessController)
);

router.get(
  '/',
  businessController.list.bind(businessController)
);

router.get(
  '/default',
  businessController.getDefault.bind(businessController)
);

router.get(
  '/:id',
  validate(getBusinessSchema),
  businessController.getById.bind(businessController)
);

router.put(
  '/:id',
  validate(updateBusinessSchema),
  autoActivityLogger,
  businessController.update.bind(businessController)
);

router.delete(
  '/:id',
  validate(getBusinessSchema),
  autoActivityLogger,
  businessController.delete.bind(businessController)
);

router.put(
  '/:id/plan',
  validate(updatePlanSchema),
  autoActivityLogger,
  businessController.updatePlan.bind(businessController)
);

export default router;
