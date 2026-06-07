// ==================== USER TYPES ====================

export enum SubscriptionPlan {
  FREE = 'FREE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  DIAMOND = 'DIAMOND',
}

export interface IUser {
  id: string;
  email: string;
  fullName: string;
  businessName: string | null;
  gstNumber: string | null;
  phone: string | null;
  address: string | null;
  plan: SubscriptionPlan;
  createdAt: string;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface IAuthResponse {
  user: IUser;
  tokens: IAuthTokens;
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
  createdAt: string;
  updatedAt: string;
}

export interface IClientFormData {
  name: string;
  email: string;
  phone: string;
  gstNumber: string;
  address: string;
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
  id?: string;
  description: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface IInvoice {
  id: string;
  userId: string;
  clientId: string | null;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  status: InvoiceStatus;
  gstType: GstType;
  gstRate: number;
  subtotal: number;
  gstAmount: number;
  total: number;
  notes: string | null;
  items: IInvoiceItem[];
  client?: IClient;
  createdAt: string;
  updatedAt: string;
}

export interface IInvoiceFormData {
  clientId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  gstType: GstType;
  gstRate: number;
  items: IInvoiceItem[];
  notes: string;
}

// ==================== PAYMENT TYPES ====================

export interface IPayment {
  id: string;
  invoiceId: string;
  amount: number;
  method: string | null;
  reference: string | null;
  status: string;
  notes: string | null;
  paidAt: string | null;
  createdAt: string;
}

// ==================== API TYPES ====================

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

export interface IPaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
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

// ==================== PLAN TYPES ====================

export interface IPlanInfo {
  name: SubscriptionPlan;
  price: number;
  maxInvoices: number;
  maxClients: number;
  canCustomizeInvoiceNumber: boolean;
  canRemoveBranding: boolean;
  hasPrioritySupport: boolean;
  hasAnalytics: boolean;
  features: string[];
}
