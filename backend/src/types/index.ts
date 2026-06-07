import { Request } from 'express';
import { z } from 'zod';

// ==================== USER TYPES ====================

export interface IUser {
  id: string;
  email: string;
  password: string;
  fullName: string;
  businessName: string | null;
  gstNumber: string | null;
  phone: string | null;
  address: string | null;
  plan: SubscriptionPlan;
  invoiceCount: number;
  clientCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPublic {
  id: string;
  email: string;
  fullName: string;
  businessName: string | null;
  gstNumber: string | null;
  phone: string | null;
  address: string | null;
  plan: SubscriptionPlan;
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

// ==================== CLIENT TYPES ====================

export interface IClient {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  gstNumber: string | null;
  address: string | null;
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
  createdAt: Date;
}

export interface IInvoice {
  id: string;
  userId: string;
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
  createdAt: Date;
  updatedAt: Date;
}

// ==================== AUTH TYPES ====================

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ITokenPayload {
  userId: string;
  email: string;
  plan: SubscriptionPlan;
}

export interface IAuthRequest extends Request {
  user?: ITokenPayload;
}

// ==================== API RESPONSE TYPES ====================

export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// ==================== PAGINATION TYPES ====================

export interface IPaginationParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
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
