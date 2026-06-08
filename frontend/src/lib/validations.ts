import { z } from "zod";

// ─── Auth Schemas ──────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required").max(100),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    businessName: z.string().max(100).optional().default(""),
    phone: z.string().max(20).optional().default(""),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ─── Client Schemas ────────────────────────────────────────
export const clientSchema = z.object({
  name: z.string().min(1, "Client name is required").max(200),
  company: z.string().max(200).optional().default(""),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(20).optional().default(""),
  gstNumber: z.string().max(20).optional().default(""),
  pan: z.string().max(20).optional().default(""),
  billingAddress: z.string().max(500).optional().default(""),
  shippingAddress: z.string().max(500).optional().default(""),
  notes: z.string().max(1000).optional().default(""),
  tags: z.array(z.string()).optional().default([]),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// ─── Invoice Schemas ───────────────────────────────────────
export const invoiceSchema = z.object({
  clientId: z.string().optional().default(""),
  dueDate: z.string().optional().default(""),
  gstType: z.enum(["CGST_SGST", "IGST", "UTGST"]).default("CGST_SGST"),
  gstRate: z.coerce.number().min(0).max(100).default(18),
  items: z.array(
    z.object({
      description: z.string().min(1, "Description required").max(500),
      hsnCode: z.string().max(20).optional().default(""),
      quantity: z.coerce.number().min(0.01),
      rate: z.coerce.number().min(0),
    })
  ).min(1, "At least one item is required"),
  notes: z.string().max(1000).optional().default(""),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

// ─── Payment Schemas ───────────────────────────────────────
export const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be at least 0.01"),
  method: z.enum(["Cash", "BankTransfer", "UPI", "Card", "Cheque", "Online", "Other"]),
  reference: z.string().max(100).optional().default(""),
  notes: z.string().max(500).optional().default(""),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

// ─── Profile Schemas ───────────────────────────────────────
export const profileSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  avatar: z.string().optional().default(""),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ─── Business Schemas ──────────────────────────────────────
export const newBusinessSchema = z.object({
  name: z.string().min(1, "Business name is required").max(200),
});

export type NewBusinessFormData = z.infer<typeof newBusinessSchema>;

// ─── Expense Schemas ───────────────────────────────────────
export const expenseSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().min(0.01, "Amount must be at least 0.01"),
  description: z.string().max(500).optional().default(""),
  date: z.string().min(1, "Date is required"),
  taxAmount: z.coerce.number().min(0).optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;

// ─── Recurring Invoice Schemas ─────────────────────────────
export const recurringInvoiceSchema = z.object({
  clientId: z.string().min(1, "Please select a client"),
  frequency: z.enum(["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().default(""),
  autoSend: z.boolean().default(false),
  items: z.array(
    z.object({
      description: z.string().min(1, "Description required"),
      hsnCode: z.string().optional().default(""),
      quantity: z.coerce.number().min(0.01),
      rate: z.coerce.number().min(0),
    })
  ).min(1, "At least one item is required"),
  notes: z.string().max(1000).optional().default(""),
});

export type RecurringInvoiceFormData = z.infer<typeof recurringInvoiceSchema>;

// ─── Estimate Schemas ──────────────────────────────────────
export const estimateSchema = z.object({
  clientId: z.string().min(1, "Please select a client"),
  title: z.string().min(1, "Title is required").max(200),
  expiryDate: z.string().optional().default(""),
  items: z.array(
    z.object({
      description: z.string().min(1, "Description required"),
      hsnCode: z.string().optional().default(""),
      quantity: z.coerce.number().min(0.01),
      rate: z.coerce.number().min(0),
    })
  ).min(1, "At least one item is required"),
  notes: z.string().max(1000).optional().default(""),
  terms: z.string().max(1000).optional().default(""),
});

export type EstimateFormData = z.infer<typeof estimateSchema>;

// ─── Team Invite Schema ────────────────────────────────────
export const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["Admin", "Accountant", "Manager", "Employee", "Viewer"]),
});

export type InviteFormData = z.infer<typeof inviteSchema>;
