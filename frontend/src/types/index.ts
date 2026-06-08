// ─── User & Auth ───────────────────────────────────────────
export interface IUser {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  phone?: string;
  currency: string;
  language: string;
  timezone: string;
  plan: SubscriptionPlan;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IBusiness {
  id: string;
  userId: string;
  name: string;
  gstNumber?: string;
  pan?: string;
  phone?: string;
  address?: string;
  logo?: string;
  invoicePrefix: string;
  nextInvoiceNo: number;
  plan: SubscriptionPlan;
  createdAt: string;
  updatedAt: string;
}

export enum SubscriptionPlan {
  Free = 'Free',
  Starter = 'Starter',
  Professional = 'Professional',
  Business = 'Business',
}

export enum ClientStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Archived = 'Archived',
}

export enum InvoiceStatus {
  Draft = 'Draft',
  Sent = 'Sent',
  Viewed = 'Viewed',
  PartiallyPaid = 'PartiallyPaid',
  Paid = 'Paid',
  Overdue = 'Overdue',
  Cancelled = 'Cancelled',
}

export enum EstimateStatus {
  Draft = 'Draft',
  Sent = 'Sent',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Expired = 'Expired',
}

export enum RecurringFrequency {
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
  Quarterly = 'Quarterly',
  Yearly = 'Yearly',
}

export enum PaymentMethod {
  Cash = 'Cash',
  BankTransfer = 'BankTransfer',
  UPI = 'UPI',
  Card = 'Card',
  Cheque = 'Cheque',
  Online = 'Online',
  Other = 'Other',
}

export enum PaymentStatus {
  Pending = 'Pending',
  Completed = 'Completed',
  Failed = 'Failed',
  Refunded = 'Refunded',
}

export enum TeamRole {
  Owner = 'Owner',
  Admin = 'Admin',
  Accountant = 'Accountant',
  Manager = 'Manager',
  Employee = 'Employee',
  Viewer = 'Viewer',
}

export enum InvitationStatus {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Expired = 'Expired',
}

export enum NotificationType {
  Invoice = 'Invoice',
  Payment = 'Payment',
  System = 'System',
  Reminder = 'Reminder',
}

// ─── Clients ───────────────────────────────────────────────
export interface IClient {
  id: string;
  userId: string;
  businessId: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  pan?: string;
  billingAddress?: string;
  shippingAddress?: string;
  notes?: string;
  tags: string[];
  status: ClientStatus;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

// ─── Line Items ────────────────────────────────────────────
export interface ILineItem {
  id?: string;
  type: 'Product' | 'Service' | 'Custom';
  description: string;
  hsnCode?: string;
  quantity: number;
  rate: number;
  discount: number;
  taxRate: number;
  amount: number;
}

// ─── Invoices ──────────────────────────────────────────────
export interface IInvoice {
  id: string;
  userId: string;
  businessId: string;
  clientId?: string;
  client?: IClient;
  recurringId?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  items: ILineItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  status: InvoiceStatus;
  notes?: string;
  terms?: string;
  payments?: IPayment[];
  statusLogs?: IStatusLog[];
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

// ─── Estimates ─────────────────────────────────────────────
export interface IEstimate {
  id: string;
  userId: string;
  businessId: string;
  clientId: string;
  client?: IClient;
  estimateNumber: string;
  title: string;
  items: ILineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  status: EstimateStatus;
  expiryDate?: string;
  notes?: string;
  terms?: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

// ─── Recurring Invoices ────────────────────────────────────
export interface IRecurringInvoice {
  id: string;
  userId: string;
  businessId: string;
  clientId: string;
  client?: IClient;
  template: IRecurringTemplate;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
  nextRun: string;
  autoSend: boolean;
  _count?: { invoices: number };
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface IRecurringTemplate {
  title: string;
  items: ILineItem[];
  notes?: string;
  terms?: string;
  taxAmount?: number;
  discountAmount?: number;
}

// ─── Payments ──────────────────────────────────────────────
export interface IPayment {
  id: string;
  invoiceId: string;
  userId: string;
  invoice?: IInvoice;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  status: PaymentStatus;
  paidAt?: string;
  createdAt: string;
  deletedAt?: string;
}

// ─── Expenses ──────────────────────────────────────────────
export interface IExpense {
  id: string;
  userId: string;
  businessId: string;
  category: string;
  amount: number;
  description?: string;
  receiptUrl?: string;
  date: string;
  taxAmount?: number;
  createdAt: string;
  deletedAt?: string;
}

// ─── Activity Log ──────────────────────────────────────────
export interface IActivityLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  method: string;
  path: string;
  statusCode?: number;
  ip?: string;
  userAgent?: string;
  metadata?: unknown;
  createdAt: string;
}

// ─── Status Log ────────────────────────────────────────────
export interface IStatusLog {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
  changedBy: string;
  metadata?: unknown;
  createdAt: string;
}

// ─── Team ──────────────────────────────────────────────────
export interface ITeamMember {
  id: string;
  businessId: string;
  userId: string;
  user?: IUser;
  role: TeamRole;
  permissions: string[];
  invitedBy: string;
  joinedAt: string;
  deletedAt?: string;
}

export interface IInvitation {
  id: string;
  businessId: string;
  email: string;
  role: TeamRole;
  token: string;
  expiresAt: string;
  status: InvitationStatus;
  createdAt: string;
}

// ─── Notifications ─────────────────────────────────────────
export interface INotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// ─── Files ─────────────────────────────────────────────────
export interface IFile {
  id: string;
  userId: string;
  businessId: string;
  entityType: string;
  entityId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
  deletedAt?: string;
}

// ─── Dashboard / Stats ─────────────────────────────────────
export interface IDashboardStats {
  totalInvoices: number;
  monthlyInvoices: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingAmount: number;
  overdueCount: number;
  paidCount: number;
  draftCount: number;
  recentInvoices?: IInvoice[];
}

// ─── API Response ──────────────────────────────────────────
export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ─── API Error ─────────────────────────────────────────────
export interface IApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

// ─── Form Data Types ───────────────────────────────────────
export interface ProfileFormData {
  fullName: string;
  avatar?: string;
}

export interface NewBusinessFormData {
  name: string;
}

export interface ClientFormData {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  pan?: string;
  billingAddress?: string;
  shippingAddress?: string;
  notes?: string;
  tags?: string[];
}
