import { z } from 'zod';

export const createClientSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Client name is required' })
      .min(2, 'Name must be at least 2 characters')
      .max(200, 'Name must be less than 200 characters'),
    email: z
      .string()
      .email('Invalid email address')
      .optional()
      .nullable(),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number')
      .optional()
      .nullable(),
    gstNumber: z
      .string()
      .regex(
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        'Invalid GST number format'
      )
      .optional()
      .nullable(),
    address: z.string().max(500).optional().nullable(),
  }),
});

export const updateClientSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(200).optional(),
    email: z.string().email('Invalid email address').optional().nullable(),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number')
      .optional()
      .nullable(),
    gstNumber: z
      .string()
      .regex(
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        'Invalid GST number format'
      )
      .optional()
      .nullable(),
    address: z.string().max(500).optional().nullable(),
  }),
  params: z.object({
    id: z.string({ required_error: 'Client ID is required' }),
  }),
});

export const getClientSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'Client ID is required' }),
  }),
});

export const listClientsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'createdAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export type CreateClientInput = z.infer<typeof createClientSchema>['body'];
export type UpdateClientInput = z.infer<typeof updateClientSchema>['body'];
export type ListClientsQuery = z.infer<typeof listClientsSchema>['query'];
