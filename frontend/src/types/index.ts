// ─── User & Auth ───────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  currency: string;
  timezone: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  role: BusinessRole;
  createdAt: string;
  updatedAt: string;
}

export type BusinessRole = "owner" | "admin" | "member";

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ─── Clients ───────────────────────────────────────────────
export interface Client {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  notes?: string;
  tags: string[];
  totalRevenue: number;
  outstandingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClientFormData {
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  notes?: string;
  tags?: string[];
}

// ─── Products / Services ───────────────────────────────────
export interface Product {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  taxRate: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  description?: string;
  sku?: string;
  price: number;
  taxRate?: number;
  unit?: string;
  isActive?: boolean;
}

// ─── Invoice Line Items ────────────────────────────────────
export interface InvoiceLineItem {
  id?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

// ─── Invoices ──────────────────────────────────────────────
export type InvoiceStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "paid"
  | "partial"
  | "overdue"
  | "cancelled"
  | "refunded";

export interface Invoice {
  id: string;
  businessId: string;
  clientId: string;
  client?: Client;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  notes?: string;
  terms?: string;
  discountType?: "percentage" | "fixed";
  discountValue: number;
  subtotal: number;
  taxTotal: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  lineItems: InvoiceLineItem[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceFormData {
  clientId: string;
  issueDate: string;
  dueDate: string;
  notes?: string;
  terms?: string;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  lineItems: {
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
  }[];
}

// ─── Payments ──────────────────────────────────────────────
export type PaymentMethod =
  | "cash"
  | "bank_transfer"
  | "credit_card"
  | "debit_card"
  | "check"
  | "paypal"
  | "stripe"
  | "other";

export interface Payment {
  id: string;
  invoiceId: string;
  businessId: string;
  clientId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentFormData {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  paidAt: string;
}

// ─── Dashboard / Stats ─────────────────────────────────────
export interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  outstandingAmount: number;
  outstandingChange: number;
  overdueInvoices: number;
  overdueChange: number;
  paidInvoices: number;
  paidChange: number;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  outstanding: number;
}

export interface InvoiceStatusData {
  name: string;
  value: number;
  color: string;
}

export interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: string;
}

// ─── API Pagination ────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

// ─── API Error ─────────────────────────────────────────────
export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string[]>;
}
