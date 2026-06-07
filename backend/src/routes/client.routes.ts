import { Router } from 'express';
import * as clientController from '../controllers/client.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createClientSchema,
  updateClientSchema,
} from '../validators/client.validator.js';

const router = Router({ mergeParams: true });

router.use(auth);

router.post('/', validate(createClientSchema), clientController.create);
router.get('/', clientController.getAll);
router.get('/:id', clientController.getById);
router.put('/:id', validate(updateClientSchema), clientController.update);
router.delete('/:id', clientController.remove);

export default router;
