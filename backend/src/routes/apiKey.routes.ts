import { Router } from 'express';
import * as apiKeyController from '../controllers/apiKey.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();
router.use(auth);
router.get('/', apiKeyController.list);
router.post('/', apiKeyController.create);
router.delete('/:id', apiKeyController.remove);

export default router;
