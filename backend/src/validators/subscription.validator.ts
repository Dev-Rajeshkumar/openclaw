import { z } from 'zod';
import { Plan, SubscriptionStatus } from '../types/index.js';

export const updateSubscriptionSchema = z.object({
  plan: z.nativeEnum(Plan).optional(),
  status: z.nativeEnum(SubscriptionStatus).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  paymentMethod: z.string().optional(),
});
