import {
  getPlanLimits,
  canCreateInvoice,
  canCreateClient,
  PLAN_LIMITS,
  PLAN_PRICING,
} from '../utils/planLimits.js';
import { SubscriptionPlan } from '../types/index.js';

describe('Plan Limits', () => {
  describe('getPlanLimits', () => {
    it('should return FREE plan limits', () => {
      const limits = getPlanLimits(SubscriptionPlan.FREE);
      expect(limits.maxInvoices).toBe(10);
      expect(limits.maxClients).toBe(5);
      expect(limits.canCustomizeInvoiceNumber).toBe(false);
      expect(limits.canRemoveBranding).toBe(false);
      expect(limits.hasPrioritySupport).toBe(false);
      expect(limits.hasAnalytics).toBe(false);
    });

    it('should return SILVER plan limits', () => {
      const limits = getPlanLimits(SubscriptionPlan.SILVER);
      expect(limits.maxInvoices).toBe(50);
      expect(limits.maxClients).toBe(25);
      expect(limits.canCustomizeInvoiceNumber).toBe(true);
      expect(limits.hasAnalytics).toBe(true);
    });

    it('should return GOLD plan limits', () => {
      const limits = getPlanLimits(SubscriptionPlan.GOLD);
      expect(limits.maxInvoices).toBe(200);
      expect(limits.maxClients).toBe(100);
      expect(limits.canRemoveBranding).toBe(true);
      expect(limits.hasPrioritySupport).toBe(true);
    });

    it('should return DIAMOND (unlimited) plan limits', () => {
      const limits = getPlanLimits(SubscriptionPlan.DIAMOND);
      expect(limits.maxInvoices).toBe(-1);
      expect(limits.maxClients).toBe(-1);
      expect(limits.canCustomizeInvoiceNumber).toBe(true);
      expect(limits.canRemoveBranding).toBe(true);
      expect(limits.hasPrioritySupport).toBe(true);
      expect(limits.hasAnalytics).toBe(true);
    });
  });

  describe('canCreateInvoice', () => {
    it('should allow when under limit', () => {
      expect(canCreateInvoice(SubscriptionPlan.FREE, 5)).toBe(true);
    });

    it('should deny when at limit', () => {
      expect(canCreateInvoice(SubscriptionPlan.FREE, 10)).toBe(false);
    });

    it('should deny when over limit', () => {
      expect(canCreateInvoice(SubscriptionPlan.FREE, 15)).toBe(false);
    });

    it('should always allow for DIAMOND', () => {
      expect(canCreateInvoice(SubscriptionPlan.DIAMOND, 99999)).toBe(true);
    });
  });

  describe('canCreateClient', () => {
    it('should allow when under limit', () => {
      expect(canCreateClient(SubscriptionPlan.FREE, 3)).toBe(true);
    });

    it('should deny when at limit', () => {
      expect(canCreateClient(SubscriptionPlan.FREE, 5)).toBe(false);
    });

    it('should always allow for DIAMOND', () => {
      expect(canCreateClient(SubscriptionPlan.DIAMOND, 99999)).toBe(true);
    });
  });

  describe('PLAN_PRICING', () => {
    it('should have correct pricing', () => {
      expect(PLAN_PRICING[SubscriptionPlan.FREE]).toBe(0);
      expect(PLAN_PRICING[SubscriptionPlan.SILVER]).toBe(299);
      expect(PLAN_PRICING[SubscriptionPlan.GOLD]).toBe(799);
      expect(PLAN_PRICING[SubscriptionPlan.DIAMOND]).toBe(2499);
    });
  });
});
