import { z } from 'zod';
import { SubscriptionPlan } from '../types/index.js';

export const createBusinessSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Business name is required' }).min(2).max(200),
    gstNumber: z
      .string()
      .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format')
      .optional()
      .nullable(),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number').optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    logo: z.string().url().max(500).optional().nullable(),
    invoicePrefix: z.string().min(2).max(5).default('BB'),
  }),
});

export const updateBusinessSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(200).optional(),
    gstNumber: z
      .string()
      .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
      .optional()
      .nullable(),
    phone: z.string().regex(/^[6-9]\d{9}$/).optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    logo: z.string().url().max(500).optional().nullable(),
    invoicePrefix: z.string().min(2).max(5).optional(),
  }),
  params: z.object({
    id: z.string({ required_error: 'Business ID is required' }),
  }),
});

export const getBusinessSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'Business ID is required' }),
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
  params: z.object({
    id: z.string({ required_error: 'Business ID is required' }),
  }),
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>['body'];
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>['body'];
