import { z } from 'zod';
import { GstType, InvoiceStatus } from '../types/index.js';

const invoiceItemSchema = z.object({
  description: z
    .string({ required_error: 'Description is required' })
    .min(1, 'Description cannot be empty')
    .max(500, 'Description must be less than 500 characters'),
  hsnCode: z
    .string({ required_error: 'HSN code is required' })
    .min(4, 'HSN code must be at least 4 characters')
    .max(8, 'HSN code must be at most 8 characters'),
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .positive('Quantity must be positive')
    .max(999999, 'Quantity too large'),
  rate: z
    .number({ required_error: 'Rate is required' })
    .positive('Rate must be positive')
    .max(99999999, 'Rate too large'),
});

export const createInvoiceSchema = z.object({
  body: z.object({
    clientId: z.string().optional().nullable(),
    invoiceNumber: z.string().max(50).optional(),
    invoiceDate: z.coerce.date().optional(),
    dueDate: z.coerce.date().optional().nullable(),
    gstType: z
      .enum([GstType.CGST_SGST, GstType.IGST, GstType.UTGST], {
        required_error: 'GST type is required',
      })
      .default(GstType.CGST_SGST),
    gstRate: z
      .number()
      .min(0, 'GST rate cannot be negative')
      .max(28, 'GST rate cannot exceed 28%')
      .default(18),
    items: z
      .array(invoiceItemSchema)
      .min(1, 'At least one item is required')
      .max(100, 'Maximum 100 items per invoice'),
    notes: z.string().max(1000).optional().nullable(),
  }),
});

export const updateInvoiceSchema = z.object({
  body: z.object({
    clientId: z.string().optional().nullable(),
    invoiceNumber: z.string().max(50).optional(),
    invoiceDate: z.coerce.date().optional(),
    dueDate: z.coerce.date().optional().nullable(),
    status: z
      .enum([
        InvoiceStatus.DRAFT,
        InvoiceStatus.SENT,
        InvoiceStatus.PAID,
        InvoiceStatus.OVERDUE,
        InvoiceStatus.CANCELLED,
      ])
      .optional(),
    gstType: z
      .enum([GstType.CGST_SGST, GstType.IGST, GstType.UTGST])
      .optional(),
    gstRate: z.number().min(0).max(28).optional(),
    items: z.array(invoiceItemSchema).min(1).max(100).optional(),
    notes: z.string().max(1000).optional().nullable(),
  }),
  params: z.object({
    id: z.string({ required_error: 'Invoice ID is required' }),
  }),
});

export const getInvoiceSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'Invoice ID is required' }),
  }),
});

export const listInvoicesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z
      .enum([
        InvoiceStatus.DRAFT,
        InvoiceStatus.SENT,
        InvoiceStatus.PAID,
        InvoiceStatus.OVERDUE,
        InvoiceStatus.CANCELLED,
      ])
      .optional(),
    search: z.string().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    sortBy: z.enum(['invoiceDate', 'total', 'createdAt', 'invoiceNumber']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export const recordPaymentSchema = z.object({
  body: z.object({
    amount: z
      .number({ required_error: 'Amount is required' })
      .positive('Amount must be positive'),
    method: z.string().max(50).optional().nullable(),
    reference: z.string().max(200).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
    paidAt: z.coerce.date().optional(),
  }),
  params: z.object({
    id: z.string({ required_error: 'Invoice ID is required' }),
  }),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>['body'];
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>['body'];
export type ListInvoicesQuery = z.infer<typeof listInvoicesSchema>['query'];
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>['body'];
