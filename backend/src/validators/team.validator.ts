import { z } from 'zod';
import { TeamRole } from '../types/index.js';

export const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(TeamRole).default(TeamRole.Employee),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
});

export const updateRoleSchema = z.object({
  role: z.nativeEnum(TeamRole),
});
