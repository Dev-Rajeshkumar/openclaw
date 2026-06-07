import { z } from 'zod';
import { RecurringFrequency, InvoiceItemType } from '../types/index.js';

const templateItemSchema = z.object({
  type: z.nativeEnum(InvoiceItemType),
  description: z.string().min(1),
  hsnCode: z.string().optional(),
  quantity: z.number().positive(),
  rate: z.number().min(0),
  discount: z.number().min(0).max(100).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  amount: z.number().min(0),
});

const templateSchema = z.object({
  title: z.string().min(1),
  items: z.array(templateItemSchema).min(1),
  notes: z.string().optional(),
  terms: z.string().optional(),
  taxAmount: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
});

export const createRecurringSchema = z.object({
  template: templateSchema,
  frequency: z.nativeEnum(RecurringFrequency),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  autoSend: z.boolean().default(false),
});

export const updateRecurringSchema = z.object({
  template: templateSchema.optional(),
  frequency: z.nativeEnum(RecurringFrequency).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional().nullable(),
  autoSend: z.boolean().optional(),
});
