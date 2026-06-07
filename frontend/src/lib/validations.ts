import { z } from "zod";

// ─── Auth Schemas ──────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(50, "First name is too long"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(50, "Last name is too long"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=*.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
    businessName: z
      .string()
      .min(1, "Business name is required")
      .max(100, "Business name is too long"),
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

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ─── Business Schemas ──────────────────────────────────────
export const businessSchema = z.object({
  name: z.string().min(1, "Business name is required").max(100),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug is too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
  address: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  taxId: z.string().max(50).optional(),
  currency: z.string().length(3).default("USD"),
  timezone: z.string().default("UTC"),
  invoicePrefix: z.string().max(10).default("INV"),
});

export type BusinessFormData = z.infer<typeof businessSchema>;

export const businessSettingsSchema = businessSchema.omit({ slug: true });

export type BusinessSettingsFormData = z.infer<typeof businessSettingsSchema>;

// ─── Client Schemas ────────────────────────────────────────
export const clientSchema = z.object({
  name: z.string().min(1, "Client name is required").max(100),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().max(20).optional().default(""),
  companyName: z.string().max(100).optional().default(""),
  address: z.string().max(500).optional().default(""),
  city: z.string().max(100).optional().default(""),
  state: z.string().max(100).optional().default(""),
  postalCode: z.string().max(20).optional().default(""),
  country: z.string().max(100).optional().default(""),
  taxId: z.string().max(50).optional().default(""),
  notes: z.string().max(1000).optional().default(""),
  tags: z.array(z.string()).optional().default([]),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// ─── Product Schemas ───────────────────────────────────────
export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  description: z.string().max(1000).optional().default(""),
  sku: z.string().max(50).optional().default(""),
  price: z.coerce
    .number()
    .min(0, "Price must be a positive number")
    .max(999999999, "Price is too high"),
  taxRate: z.coerce
    .number()
    .min(0, "Tax rate must be positive")
    .max(100, "Tax rate cannot exceed 100%")
    .default(0),
  unit: z.string().max(20).default("each"),
  isActive: z.boolean().default(true),
});

export type ProductFormData = z.infer<typeof productSchema>;

// ─── Invoice Schemas ───────────────────────────────────────
export const lineItemSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, "Description is required").max(500),
  quantity: z.coerce.number().min(0.01, "Quantity must be at least 0.01"),
  unitPrice: z.coerce.number().min(0, "Unit price must be positive"),
  taxRate: z.coerce.number().min(0).max(100).default(0),
});

export const invoiceSchema = z.object({
  clientId: z.string().min(1, "Please select a client"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().max(1000).optional().default(""),
  terms: z.string().max(1000).optional().default(""),
  discountType: z.enum(["percentage", "fixed"]).optional(),
  discountValue: z.coerce.number().min(0).default(0),
  lineItems: z
    .array(lineItemSchema)
    .min(1, "At least one line item is required"),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

// ─── Payment Schemas ───────────────────────────────────────
export const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice is required"),
  amount: z.coerce
    .number()
    .min(0.01, "Amount must be at least 0.01")
    .max(999999999, "Amount is too high"),
  method: z.enum([
    "cash",
    "bank_transfer",
    "credit_card",
    "debit_card",
    "check",
    "paypal",
    "stripe",
    "other",
  ]),
  reference: z.string().max(100).optional().default(""),
  notes: z.string().max(500).optional().default(""),
  paidAt: z.string().min(1, "Payment date is required"),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

// ─── Profile Schemas ───────────────────────────────────────
export const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain an uppercase letter, a lowercase letter, and a number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ─── Pagination ────────────────────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional().default(""),
});
