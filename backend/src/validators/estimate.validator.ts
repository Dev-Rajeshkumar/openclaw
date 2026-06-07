import { z } from 'zod';
import { EstimateStatus, InvoiceItemType } from '../types/index.js';

const estimateItemSchema = z.object({
  type: z.nativeEnum(InvoiceItemType),
  description: z.string().min(1),
  hsnCode: z.string().optional(),
  quantity: z.number().positive(),
  rate: z.number().min(0),
  discount: z.number().min(0).max(100).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  amount: z.number().min(0),
});

export const createEstimateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  items: z.array(estimateItemSchema).min(1, 'At least one item is required'),
  taxAmount: z.number().min(0).default(0),
  expiryDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

export const updateEstimateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  items: z.array(estimateItemSchema).min(1).optional(),
  taxAmount: z.number().min(0).optional(),
  expiryDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

export const updateEstimateStatusSchema = z.object({
  status: z.nativeEnum(EstimateStatus),
});
