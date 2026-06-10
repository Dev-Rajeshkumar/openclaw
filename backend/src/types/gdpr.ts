/** Shape of exported user data (GDPR right to portability). */
export interface ExportedUserData {
  exportDate: string;
  format: string;
  user: SafeUserData;
}

/** User data with sensitive fields removed. */
export interface SafeUserData {
  id: string;
  email: string;
  fullName: string;
  avatar: string | null;
  isEmailVerified: boolean;
  phone: string | null;
  currency: string;
  language: string;
  timezone: string;
  plan: string;
  createdAt: Date;
  updatedAt: Date;
  businesses: unknown[];
  clients: unknown[];
  invoices: unknown[];
  estimates: unknown[];
  recurringInvoices: unknown[];
  payments: unknown[];
  expenses: unknown[];
  products: unknown[];
  services: unknown[];
  files: unknown[];
  notifications: unknown[];
  activityLogs: unknown[];
  statusLogs: unknown[];
  teamMemberships: unknown[];
  apiKeys: unknown[];
  notificationPreference: unknown;
  subscription: unknown;
}
