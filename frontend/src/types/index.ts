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
  avatar: string | null;
  googleId: string | null;
  isEmailVerified: boolean;
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
  createdAt: string;
  updatedAt: string;
}

export interface IBusinessFormData {
  name: string;
  gstNumber: string;
  phone: string;
  address: string;
  logo: string;
  invoicePrefix: string;
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
  businessId: string;
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
  statusLogs?: IStatusLog[];
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

// ==================== ACTIVITY LOG TYPES ====================

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
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
  };
}

// ==================== STATUS LOG TYPES ====================

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
  createdAt: string;
}

// ==================== API TYPES ====================

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
