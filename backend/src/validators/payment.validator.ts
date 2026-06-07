import { z } from 'zod';
import { PaymentMethod } from '../types/index.js';

export const createPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  method: z.nativeEnum(PaymentMethod),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paidAt: z.string().datetime().optional(),
});
