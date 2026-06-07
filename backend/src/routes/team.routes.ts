import { Router } from 'express';
import * as teamController from '../controllers/team.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  inviteSchema,
  acceptInviteSchema,
  updateRoleSchema,
} from '../validators/team.validator.js';

const router = Router({ mergeParams: true });

router.use(auth);

router.get('/members', teamController.getMembers);
router.post('/invite', validate(inviteSchema), teamController.invite);
router.post('/accept', validate(acceptInviteSchema), teamController.acceptInvite);
router.post('/reject', validate(acceptInviteSchema), teamController.rejectInvite);
router.patch(
  '/members/:memberId/role',
  validate(updateRoleSchema),
  teamController.updateRole
);
router.delete('/members/:memberId', teamController.removeMember);
router.get('/invitations', teamController.getInvitations);
router.delete(
  '/invitations/:invitationId',
  teamController.cancelInvitation
);

export default router;
