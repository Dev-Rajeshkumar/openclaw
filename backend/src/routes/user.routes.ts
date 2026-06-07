import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import {
  updateProfileSchema,
  changePasswordSchema,
  updatePlanSchema,
} from '../validators/user.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get(
  '/profile',
  userController.getProfile.bind(userController)
);

router.put(
  '/profile',
  validate(updateProfileSchema),
  userController.updateProfile.bind(userController)
);

router.put(
  '/change-password',
  validate(changePasswordSchema),
  userController.changePassword.bind(userController)
);

router.put(
  '/plan',
  validate(updatePlanSchema),
  userController.updatePlan.bind(userController)
);

export default router;
