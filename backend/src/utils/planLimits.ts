import { Plan, PlanLimits } from '../types/index.js';

/**
 * Plan limits for each subscription tier.
 * Plans are per-user (User.plan), not per-business.
 */
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  [Plan.Free]: {
    maxBusinesses: 1,
    maxClients: 10,
    maxInvoicesPerMonth: 5,
    maxTeamMembers: 1,
    maxStorageMB: 50,
    canExportPDF: true,
    canSendEmail: false,
    canUseRecurring: false,
    canUseCustomBranding: false,
    canUseAPI: false,
    canUseReports: false,
  },
  [Plan.Starter]: {
    maxBusinesses: 1,
    maxClients: 50,
    maxInvoicesPerMonth: 50,
    maxTeamMembers: 3,
    maxStorageMB: 200,
    canExportPDF: true,
    canSendEmail: true,
    canUseRecurring: false,
    canUseCustomBranding: true,
    canUseAPI: false,
    canUseReports: true,
  },
  [Plan.Professional]: {
    maxBusinesses: 3,
    maxClients: 200,
    maxInvoicesPerMonth: 500,
    maxTeamMembers: 10,
    maxStorageMB: 1024,
    canExportPDF: true,
    canSendEmail: true,
    canUseRecurring: true,
    canUseCustomBranding: true,
    canUseAPI: true,
    canUseReports: true,
  },
  [Plan.Business]: {
    maxBusinesses: 10,
    maxClients: 1000,
    maxInvoicesPerMonth: 5000,
    maxTeamMembers: 50,
    maxStorageMB: 5120,
    canExportPDF: true,
    canSendEmail: true,
    canUseRecurring: true,
    canUseCustomBranding: true,
    canUseAPI: true,
    canUseReports: true,
  },
};

/**
 * Get plan limits for a given plan
 */
export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS[Plan.Free];
}

/**
 * Check if a user can perform an action based on their plan
 */
export function canPerformAction(
  plan: Plan,
  action: keyof PlanLimits
): boolean {
  const limits = getPlanLimits(plan);
  return !!limits[action];
}

/**
 * Check if a user is within a numeric limit
 */
export function isWithinLimit(
  plan: Plan,
  limitKey: 'maxBusinesses' | 'maxClients' | 'maxInvoicesPerMonth' | 'maxTeamMembers' | 'maxStorageMB',
  currentCount: number
): boolean {
  const limits = getPlanLimits(plan);
  return currentCount < limits[limitKey];
}

/**
 * Get the plan display name
 */
export function getPlanDisplayName(plan: Plan): string {
  const names: Record<Plan, string> = {
    [Plan.Free]: 'Free',
    [Plan.Starter]: 'Starter',
    [Plan.Professional]: 'Professional',
    [Plan.Business]: 'Business',
  };
  return names[plan] || 'Free';
}

/**
 * Get plan price (monthly, in INR)
 */
export function getPlanPrice(plan: Plan): number {
  const prices: Record<Plan, number> = {
    [Plan.Free]: 0,
    [Plan.Starter]: 499,
    [Plan.Professional]: 1499,
    [Plan.Business]: 4999,
  };
  return prices[plan] || 0;
}

/**
 * Get all plans info for display
 */
export function getAllPlans(): Array<{
  plan: Plan;
  name: string;
  price: number;
  limits: PlanLimits;
}> {
  return Object.values(Plan).map((plan) => ({
    plan,
    name: getPlanDisplayName(plan),
    price: getPlanPrice(plan),
    limits: getPlanLimits(plan),
  }));
}
