import { Router } from 'express';
import * as razorpayPaymentController from '../controllers/razorpayPayment.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Public routes (no auth) — called from public invoice page
router.post('/invoice/:token/create-order', razorpayPaymentController.createOrder);
router.post('/invoice/:token/verify', razorpayPaymentController.verifyPayment);

// Webhook (no auth — Razorpay calls this)
router.post('/webhook', razorpayPaymentController.webhook);

// Authenticated routes
router.use(auth);
router.put('/settings/:businessId', razorpayPaymentController.updateSettings);

export default router;
