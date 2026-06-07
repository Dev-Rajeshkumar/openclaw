import { Router } from 'express';
import { clientController } from '../controllers/client.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import {
  createClientSchema,
  updateClientSchema,
  getClientSchema,
  listClientsSchema,
} from '../validators/client.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post(
  '/',
  validate(createClientSchema),
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
  clientController.update.bind(clientController)
);

router.delete(
  '/:id',
  validate(getClientSchema),
  clientController.delete.bind(clientController)
);

export default router;
