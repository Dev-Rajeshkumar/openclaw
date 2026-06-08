import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  sku: z.string().max(50).optional().default(''),
  hsnCode: z.string().max(20).optional().default(''),
  description: z.string().max(1000).optional().default(''),
  unitPrice: z.number().min(0, 'Price must be positive').default(0),
  taxRate: z.number().min(0).max(100).default(0),
  category: z.string().max(100).optional().default(''),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  sku: z.string().max(50).optional(),
  hsnCode: z.string().max(20).optional(),
  description: z.string().max(1000).optional(),
  unitPrice: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  category: z.string().max(100).optional(),
});
