import { Router } from 'express';
import * as subscriptionController from '../controllers/subscription.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.get('/', subscriptionController.getSubscription);
router.post('/', subscriptionController.create);
router.put('/', subscriptionController.update);
router.post('/cancel', subscriptionController.cancel);
router.post('/renew', subscriptionController.renew);

export default router;
