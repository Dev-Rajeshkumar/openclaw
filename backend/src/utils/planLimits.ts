import { SubscriptionPlan, IPlanLimits } from '../types/index.js';

export const PLAN_LIMITS: Record<SubscriptionPlan, IPlanLimits> = {
  [SubscriptionPlan.FREE]: {
    maxInvoices: 10,
    maxClients: 5,
    canCustomizeInvoiceNumber: false,
    canRemoveBranding: false,
    hasPrioritySupport: false,
    hasAnalytics: false,
  },
  [SubscriptionPlan.SILVER]: {
    maxInvoices: 50,
    maxClients: 25,
    canCustomizeInvoiceNumber: true,
    canRemoveBranding: false,
    hasPrioritySupport: false,
    hasAnalytics: true,
  },
  [SubscriptionPlan.GOLD]: {
    maxInvoices: 200,
    maxClients: 100,
    canCustomizeInvoiceNumber: true,
    canRemoveBranding: true,
    hasPrioritySupport: true,
    hasAnalytics: true,
  },
  [SubscriptionPlan.DIAMOND]: {
    maxInvoices: -1, // unlimited
    maxClients: -1, // unlimited
    canCustomizeInvoiceNumber: true,
    canRemoveBranding: true,
    hasPrioritySupport: true,
    hasAnalytics: true,
  },
};

export const PLAN_PRICING: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.FREE]: 0,
  [SubscriptionPlan.SILVER]: 299,
  [SubscriptionPlan.GOLD]: 799,
  [SubscriptionPlan.DIAMOND]: 2499,
};

export const getPlanLimits = (plan: SubscriptionPlan): IPlanLimits => {
  return PLAN_LIMITS[plan];
};

export const canCreateInvoice = (
  plan: SubscriptionPlan,
  currentInvoiceCount: number
): boolean => {
  const limits = getPlanLimits(plan);
  if (limits.maxInvoices === -1) return true;
  return currentInvoiceCount < limits.maxInvoices;
};

export const canCreateClient = (
  plan: SubscriptionPlan,
  currentClientCount: number
): boolean => {
  const limits = getPlanLimits(plan);
  if (limits.maxClients === -1) return true;
  return currentClientCount < limits.maxClients;
};
