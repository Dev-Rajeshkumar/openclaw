import { z } from 'zod';

export const createExpenseSchema = z.object({
  category: z.string().min(1, 'Category is required').max(100),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  date: z.string().datetime().optional(),
  taxAmount: z.number().min(0).optional(),
});

export const updateExpenseSchema = z.object({
  category: z.string().min(1).max(100).optional(),
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  date: z.string().datetime().optional(),
  taxAmount: z.number().min(0).optional(),
});
