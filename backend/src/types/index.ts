import { Request } from 'express';

// Enums
export enum Plan {
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

export enum EstimateStatus {
  Draft = 'Draft',
  Sent = 'Sent',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Expired = 'Expired',
}

export enum InvoiceStatus {
  Draft = 'Draft',
  PendingReview = 'PendingReview',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Sent = 'Sent',
  Viewed = 'Viewed',
  PartiallyPaid = 'PartiallyPaid',
  Paid = 'Paid',
  Overdue = 'Overdue',
  Cancelled = 'Cancelled',
}

export enum InvoiceItemType {
  Product = 'Product',
  Service = 'Service',
  Custom = 'Custom',
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

export enum SubscriptionStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Cancelled = 'Cancelled',
  PastDue = 'PastDue',
}

// Interfaces
export interface JwtPayload {
  userId: string;
  email: string;
  plan: Plan;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  businessId?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface EstimateItem {
  type: InvoiceItemType;
  description: string;
  hsnCode?: string;
  quantity: number;
  rate: number;
  discount: number;
  taxRate: number;
  amount: number;
}

export interface InvoiceItem {
  type: InvoiceItemType;
  description: string;
  hsnCode?: string;
  quantity: number;
  rate: number;
  discount: number;
  taxRate: number;
  amount: number;
}

export interface RecurringTemplate {
  title: string;
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
  taxAmount?: number;
  discountAmount?: number;
}

export interface PlanLimits {
  maxBusinesses: number;
  maxClients: number;
  maxInvoicesPerMonth: number;
  maxTeamMembers: number;
  maxStorageMB: number;
  canExportPDF: boolean;
  canSendEmail: boolean;
  canUseRecurring: boolean;
  canUseCustomBranding: boolean;
  canUseAPI: boolean;
  canUseReports: boolean;
}

export interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  timestamp?: string;
}

export interface FilterOptions {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  clientId?: string;
  category?: string;
  tags?: string[];
}
