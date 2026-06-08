import { Router } from 'express';
import prisma from '../prisma/index.js';
import * as recurringController from '../controllers/recurringInvoice.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';
import { createRecurringSchema, updateRecurringSchema } from '../validators/recurringInvoice.validator.js';

const router = Router({ mergeParams: true });

router.use(auth);

router.post(
  '/client/:clientId',
  validate(createRecurringSchema),
  recurringController.create
);
router.get('/', recurringController.getAll);
router.get('/:id', recurringController.getById);
router.get('/:id/invoices', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const invoices = await prisma.invoice.findMany({
      where: { recurringId: id, userId, deletedAt: null },
      include: { client: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(ApiResponse.success(invoices));
  } catch (error) { next(error); }
});
router.put('/:id', validate(updateRecurringSchema), recurringController.update);
router.delete('/:id', recurringController.remove);

export default router;
