import { z } from 'zod';
import { ClientStatus } from '../types/index.js';

export const createClientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  company: z.string().max(200).optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional(),
  gstNumber: z.string().optional(),
  pan: z.string().optional(),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.nativeEnum(ClientStatus).optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  company: z.string().max(200).optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional(),
  gstNumber: z.string().optional(),
  pan: z.string().optional(),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.nativeEnum(ClientStatus).optional(),
});
