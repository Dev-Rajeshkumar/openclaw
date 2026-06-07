import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { autoActivityLogger } from '../middleware/activityLogger.js';
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  refreshTokenSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  autoActivityLogger,
  authController.register.bind(authController)
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  autoActivityLogger,
  authController.login.bind(authController)
);

router.post(
  '/google',
  authLimiter,
  validate(googleAuthSchema),
  autoActivityLogger,
  authController.googleAuth.bind(authController)
);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refreshToken.bind(authController)
);

router.get(
  '/me',
  authenticate,
  authController.me.bind(authController)
);

export default router;
