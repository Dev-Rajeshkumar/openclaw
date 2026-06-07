import { z } from 'zod';
import { GstType, SubscriptionPlan } from '@/types';

// ==================== AUTH VALIDATIONS ====================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  businessName: z.string().max(200).optional(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number')
    .optional(),
});

// ==================== CLIENT VALIDATIONS ====================

export const clientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number')
    .optional()
    .or(z.literal('')),
  gstNumber: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      'Invalid GST number format'
    )
    .optional()
    .or(z.literal('')),
  address: z.string().max(500).optional(),
});

// ==================== INVOICE VALIDATIONS ====================

export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  hsnCode: z.string().min(4, 'HSN code must be at least 4 characters').max(8),
  quantity: z.number().positive('Quantity must be positive'),
  rate: z.number().positive('Rate must be positive'),
});

export const invoiceSchema = z.object({
  clientId: z.string().optional(),
  invoiceNumber: z.string().max(50).optional(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  gstType: z.enum([GstType.CGST_SGST, GstType.IGST, GstType.UTGST]),
  gstRate: z.number().min(0).max(28),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  notes: z.string().max(1000).optional(),
});

// ==================== PROFILE VALIDATIONS ====================

export const profileSchema = z.object({
  fullName: z.string().min(2).max(100),
  businessName: z.string().max(200).optional(),
  gstNumber: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .optional()
    .or(z.literal('')),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional().or(z.literal('')),
  address: z.string().max(500).optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and number'
      ),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ==================== TYPES ====================

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ClientFormData = z.infer<typeof clientSchema>;
export type InvoiceFormData = z.infer<typeof invoiceSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
