import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createProductSchema,
  updateProductSchema,
} from '../validators/product.validator.js';

const router = Router({ mergeParams: true });

router.use(auth);

router.post('/', validate(createProductSchema), productController.create);
router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.put('/:id', validate(updateProductSchema), productController.update);
router.delete('/:id', productController.remove);

export default router;
