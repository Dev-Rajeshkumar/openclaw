import { Router } from 'express';
import * as expenseController from '../controllers/expense.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createExpenseSchema,
  updateExpenseSchema,
} from '../validators/expense.validator.js';

const router = Router({ mergeParams: true });

router.use(auth);

router.post('/', validate(createExpenseSchema), expenseController.create);
router.get('/', expenseController.getAll);
router.get('/stats', expenseController.getStats);
router.get('/:id', expenseController.getById);
router.put('/:id', validate(updateExpenseSchema), expenseController.update);
router.delete('/:id', expenseController.remove);

export default router;
