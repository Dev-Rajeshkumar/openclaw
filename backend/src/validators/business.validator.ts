import { z } from 'zod';

export const createBusinessSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters').max(200),
  gstNumber: z.string().optional(),
  pan: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  logo: z.string().url().optional(),
  invoicePrefix: z.string().max(10).optional(),
});

export const updateBusinessSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  gstNumber: z.string().optional(),
  pan: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  logo: z.string().url().optional(),
  invoicePrefix: z.string().max(10).optional(),
});
