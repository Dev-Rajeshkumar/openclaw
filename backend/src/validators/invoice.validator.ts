import { z } from 'zod';
import { InvoiceItemType, InvoiceStatus } from '../types/index.js';

const invoiceItemSchema = z.object({
  type: z.nativeEnum(InvoiceItemType),
  description: z.string().min(1, 'Description is required'),
  hsnCode: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  rate: z.number().min(0, 'Rate must be non-negative'),
  discount: z.number().min(0).max(100).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  amount: z.number().min(0, 'Amount must be non-negative'),
});

export const createInvoiceSchema = z.object({
  clientId: z.string().optional(),
  invoiceDate: z.string().datetime().optional(),
  dueDate: z.string().datetime({ message: 'Due date is required' }),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  discountAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

export const updateInvoiceSchema = z.object({
  clientId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  items: z.array(invoiceItemSchema).min(1).optional(),
  discountAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.nativeEnum(InvoiceStatus),
});
