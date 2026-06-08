import { Router } from 'express';
import * as templateController from '../controllers/invoiceTemplate.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.use(auth);

router.get('/', templateController.getTemplates);
router.get('/available/:plan', templateController.getAvailableByPlan);
router.get('/:slug', templateController.getTemplate);
router.post('/custom', templateController.createCustom);
router.post('/default', templateController.setDefault);

export default router;
