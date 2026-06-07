import { Router } from 'express';
import { clientController } from '../controllers/client.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate, requireBusiness } from '../middleware/auth.js';
import { autoActivityLogger } from '../middleware/activityLogger.js';
import {
  createClientSchema,
  updateClientSchema,
  getClientSchema,
  listClientsSchema,
} from '../validators/client.validator.js';

const router = Router();
router.use(authenticate, requireBusiness);

router.post(
  '/',
  validate(createClientSchema),
  autoActivityLogger,
  clientController.create.bind(clientController)
);

router.get(
  '/',
  validate(listClientsSchema),
  clientController.list.bind(clientController)
);

router.get(
  '/:id',
  validate(getClientSchema),
  clientController.getById.bind(clientController)
);

router.put(
  '/:id',
  validate(updateClientSchema),
  autoActivityLogger,
  clientController.update.bind(clientController)
);

router.delete(
  '/:id',
  validate(getClientSchema),
  autoActivityLogger,
  clientController.delete.bind(clientController)
);

export default router;
