import { z } from 'zod';
import { SubscriptionPlan } from '../types/index.js';

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).max(100).optional(),
    businessName: z.string().max(200).optional().nullable(),
    gstNumber: z
      .string()
      .regex(
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        'Invalid GST number format'
      )
      .optional()
      .nullable(),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number')
      .optional()
      .nullable(),
    address: z.string().max(500).optional().nullable(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string({ required_error: 'Current password is required' }),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be less than 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
  }),
});

export const updatePlanSchema = z.object({
  body: z.object({
    plan: z.enum([
      SubscriptionPlan.FREE,
      SubscriptionPlan.SILVER,
      SubscriptionPlan.GOLD,
      SubscriptionPlan.DIAMOND,
    ], { required_error: 'Plan is required' }),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>['body'];
