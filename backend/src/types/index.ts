import { Request } from 'express';

// ==================== USER TYPES ====================

export interface IUser {
  id: string;
  email: string;
  password: string | null;
  fullName: string;
  avatar: string | null;
  googleId: string | null;
  isEmailVerified: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPublic {
  id: string;
  email: string;
  fullName: string;
  avatar: string | null;
  googleId: string | null;
  isEmailVerified: boolean;
  createdAt: Date;
}

// ==================== SUBSCRIPTION PLAN TYPES ====================

export enum SubscriptionPlan {
  FREE = 'FREE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  DIAMOND = 'DIAMOND',
}

export interface IPlanLimits {
  maxInvoices: number;
  maxClients: number;
  canCustomizeInvoiceNumber: boolean;
  canRemoveBranding: boolean;
  hasPrioritySupport: boolean;
  hasAnalytics: boolean;
}

// ==================== BUSINESS TYPES ====================

export interface IBusiness {
  id: string;
  userId: string;
  name: string;
  gstNumber: string | null;
  phone: string | null;
  address: string | null;
  logo: string | null;
  invoicePrefix: string;
  nextInvoiceNo: number;
  plan: SubscriptionPlan;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== CLIENT TYPES ====================

export interface IClient {
  id: string;
  userId: string;
  businessId: string;
  name: string;
  email: string | null;
  phone: string | null;
  gstNumber: string | null;
  address: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== INVOICE TYPES ====================

export enum GstType {
  CGST_SGST = 'CGST_SGST',
  IGST = 'IGST',
  UTGST = 'UTGST',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export interface IInvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  amount: number;
  deletedAt: Date | null;
  createdAt: Date;
}

export interface IInvoice {
  id: string;
  userId: string;
  businessId: string;
  clientId: string | null;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date | null;
  status: InvoiceStatus;
  gstType: GstType;
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  total: number;
  notes: string | null;
  deletedAt: Date | null;
  createdBy: string;
  updatedBy: string;
  items: IInvoiceItem[];
  createdAt: Date;
  updatedAt: Date;
}

// ==================== PAYMENT TYPES ====================

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface IPayment {
  id: string;
  invoiceId: string;
  userId: string;
  amount: number;
  method: string | null;
  reference: string | null;
  status: PaymentStatus;
  notes: string | null;
  paidAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== ACTIVITY LOG TYPES (internal) ====================

export interface IActivityLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string | null;
  method: string;
  path: string;
  statusCode: number | null;
  ip: string | null;
  userAgent: string | null;
  requestBody: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

// ==================== STATUS LOG TYPES (user-facing) ====================

export interface IStatusLog {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  description: string | null;
  changedBy: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

// ==================== AUTH TYPES ====================

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ITokenPayload {
  userId: string;
  email: string;
}

export interface IAuthRequest extends Request {
  user?: ITokenPayload;
  businessId?: string;
  requestId?: string;
}

// ==================== API RESPONSE TYPES ====================

export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  requestId?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// ==================== DASHBOARD TYPES ====================

export interface IDashboardStats {
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalRevenue: number;
  pendingAmount: number;
  recentInvoices: IInvoice[];
}
