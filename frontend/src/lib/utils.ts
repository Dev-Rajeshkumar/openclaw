import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { InvoiceStatus, SubscriptionPlan } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD' | 'AUD' | 'CAD' | 'JPY' | 'CNY';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ',
  SGD: 'S$', AUD: 'A$', CAD: 'C$', JPY: '¥', CNY: '¥',
};

export const CURRENCY_LOCALES: Record<CurrencyCode, string> = {
  INR: 'en-IN', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB', AED: 'ar-AE',
  SGD: 'en-SG', AUD: 'en-AU', CAD: 'en-CA', JPY: 'ja-JP', CNY: 'zh-CN',
};

export function formatCurrency(amount: number, currency: CurrencyCode = 'INR'): string {
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency] || 'en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'JPY' ? 0 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrencyCompact(amount: number, currency: CurrencyCode = 'INR'): string {
  if (amount >= 10000000) return `${CURRENCY_SYMBOLS[currency]}${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `${CURRENCY_SYMBOLS[currency]}${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `${CURRENCY_SYMBOLS[currency]}${(amount / 1000).toFixed(1)}K`;
  return formatCurrency(amount, currency);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "Upcoming";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

// ─── Badge helpers ────────────────────────────────────────
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    Draft: "bg-gray-100 text-gray-700",
    PendingReview: "bg-amber-50 text-amber-700",
    Approved: "bg-green-50 text-green-700",
    Rejected: "bg-red-50 text-red-700",
    Sent: "bg-blue-50 text-blue-700",
    Viewed: "bg-indigo-50 text-indigo-700",
    PartiallyPaid: "bg-amber-50 text-amber-700",
    Paid: "bg-green-50 text-green-700",
    Overdue: "bg-red-50 text-red-700",
    Cancelled: "bg-gray-100 text-gray-500",
    Accepted: "bg-green-50 text-green-700",
    Rejected: "bg-red-50 text-red-700",
    Expired: "bg-gray-100 text-gray-500",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}

export function getPlanColor(plan: string): string {
  const colors: Record<string, string> = {
    Free: "bg-gray-100 text-gray-700",
    Starter: "bg-blue-50 text-blue-700",
    Professional: "bg-purple-50 text-purple-700",
    Business: "bg-amber-50 text-amber-700",
  };
  return colors[plan] || "bg-gray-100 text-gray-700";
}

// ─── Invoice helpers ──────────────────────────────────────
export function isInvoiceCancellable(status: string): boolean {
  return ["Draft", "Sent", "Viewed", "Overdue", "PartiallyPaid"].includes(status);
}

export function isInvoiceEditable(status: string): boolean {
  return status === "Draft" || status === "Rejected";
}

export function isInvoicePaid(status: string): boolean {
  return status === "Paid";
}
