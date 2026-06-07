import { Router } from 'express';
import * as businessController from '../controllers/business.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createBusinessSchema,
  updateBusinessSchema,
} from '../validators/business.validator.js';

const router = Router();

router.use(auth);

router.post('/', validate(createBusinessSchema), businessController.create);
router.get('/', businessController.getAll);
router.get('/:id/stats', businessController.getStats);
router.get('/:id', businessController.getById);
router.put('/:id', validate(updateBusinessSchema), businessController.update);
router.delete('/:id', businessController.remove);

export default router;
