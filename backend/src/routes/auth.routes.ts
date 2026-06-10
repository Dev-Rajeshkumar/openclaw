import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authLimiter, passwordResetLimiter, registerLimiter } from '../middleware/rateLimiter.js';
import { auth } from '../middleware/auth.js';
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  forgotPasswordSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.post(
  '/register',
  registerLimiter,
  validate(registerSchema),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login
);

router.post(
  '/google',
  authLimiter,
  validate(googleAuthSchema),
  authController.googleAuth
);

router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

router.get('/me', auth, authController.getMe);

// Token management
router.post('/refresh', authLimiter, authController.refreshToken);
router.post('/logout', auth, authController.logout);

export default router;
