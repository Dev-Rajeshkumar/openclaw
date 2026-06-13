'use strict';

import prisma from '../../../lib/prisma';
import { z } from 'zod';

const subscribeSchema = z.object({
  planId: z.string(),
  couponCode: z.string().optional(),
});

const meteredCheckSchema = z.object({
  postId: z.string(),
  userId: z.string().optional(),
  meterLimit: z.number().default(5),
});

const couponSchema = z.object({
  code: z.string().min(3).max(50),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().min(0).max(100),
  maxUses: z.number().min(1).optional(),
  validUntil: z.string().optional(),
});

export default ({ strapi }) => ({
  /**
   * GET /paywall/plans
   * List active subscription plans (public)
   */
  async plans(ctx) {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
    return { data: plans };
  },

  /**
   * POST /paywall/subscribe
   * Subscribe to a plan
   */
  async subscribe(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Login required');

    const { error, data } = subscribeSchema.safeParse(ctx.request.body);
    if (error) return ctx.badRequest('Validation error');

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: data.planId, isActive: true },
    });
    if (!plan) return ctx.notFound('Plan not found');

    // Check for existing active subscription
    const existing = await prisma.subscription.findFirst({
      where: { userId: user.id, status: 'active' },
    });

    if (existing) {
      return ctx.badRequest('You already have an active subscription');
    }

    // Apply coupon if provided
    let finalPrice = plan.price;
    if (data.couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: data.couponCode } });
      if (coupon && coupon.isActive && (!coupon.maxUses || coupon.usedCount < coupon.maxUses)) {
        if (coupon.discountType === 'percentage') {
          finalPrice = plan.price * (1 - coupon.discountValue / 100);
        } else {
          finalPrice = Math.max(0, plan.price - coupon.discountValue);
        }
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    // Create subscription (without Stripe for free/zero-price plans)
    const now = new Date();
    const periodEnd = new Date(now);
    if (plan.interval === 'monthly') periodEnd.setMonth(periodEnd.getMonth() + 1);
    else if (plan.interval === 'yearly') periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: finalPrice === 0 ? 'active' : 'active', // In real app, wait for payment
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    return { data: { subscription, plan, price: finalPrice } };
  },

  /**
   * GET /paywall/access/:postId
   * Check if user has access to a post
   */
  async checkAccess(ctx) {
    const user = ctx.state.user;
    const { postId } = ctx.params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) return ctx.notFound('Post not found');

    // Free access if published
    if (post.status === 'published') {
      // In a real paywall system, some posts would be premium
      // For now, all published posts are free, but we track access
      if (user) {
        await prisma.postAccessLog.create({
          data: { postId, userId: user.id, accessType: 'free' },
        }).catch(() => {});
      }

      return {
        data: {
          hasAccess: true,
          accessType: 'free',
          content: null, // null = full content
        },
      };
    }

    return { data: { hasAccess: false, accessType: 'paywalled', content: null } };
  },

  /**
   * POST /paywall/metered-check
   * Check metered paywall (N free posts per month)
   */
  async meteredCheck(ctx) {
    const { error, data } = meteredCheckSchema.safeParse(ctx.request.body);
    if (error) return ctx.badRequest('Validation error');

    // Check active subscription first
    if (data.userId) {
      const sub = await prisma.subscription.findFirst({
        where: { userId: data.userId, status: 'active' },
      });
      if (sub) {
        return { data: { hasAccess: true, accessType: 'subscription', remaining: null } };
      }
    }

    // Check metered limit
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const accessCount = await prisma.postAccessLog.count({
      where: {
        userId: data.userId || 'anonymous',
        accessedAt: { gte: startOfMonth },
        accessType: 'free',
      },
    });

    const remaining = Math.max(0, data.meterLimit - accessCount);
    const hasAccess = remaining > 0;

    return {
      data: {
        hasAccess,
        accessType: hasAccess ? 'free_metered' : 'paywalled',
        remaining,
        limit: data.meterLimit,
      },
    };
  },

  /**
   * POST /paywall/coupons/validate
   * Validate a coupon code
   */
  async validateCoupon(ctx) {
    const { code } = ctx.request.body;

    if (!code) return ctx.badRequest('Coupon code required');

    const coupon = await prisma.coupon.findUnique({ where: { code } });

    if (!coupon || !coupon.isActive) {
      return { data: { valid: false, reason: 'Invalid coupon code' } };
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return { data: { valid: false, reason: 'Coupon has been fully redeemed' } };
    }

    if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
      return { data: { valid: false, reason: 'Coupon has expired' } };
    }

    return {
      data: {
        valid: true,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        remainingUses: coupon.maxUses ? coupon.maxUses - coupon.usedCount : null,
      },
    };
  },

  /**
   * POST /paywall/coupons
   * Create a coupon (admin only)
   */
  async createCoupon(ctx) {
    const user = ctx.state.user;
    if (!user || user.role?.type !== 'admin') return ctx.unauthorized();

    const { error, data } = couponSchema.safeParse(ctx.request.body);
    if (error) return ctx.badRequest('Validation error');

    const coupon = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxUses: data.maxUses || null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
      },
    });

    return ctx.created({ data: coupon });
  },

  /**
   * POST /paywall/referral
   * Track a referral
   */
  async trackReferral(ctx) {
    const { referralCode, referredEmail } = ctx.request.body;

    const referrer = await prisma.referral.findUnique({
      where: { referralCode },
    });

    if (!referrer) return ctx.notFound('Invalid referral code');

    // Track the click/signup
    // In a real system, you'd also verify the referred user signs up
    return { data: { message: 'Referral tracked', code: referralCode } };
  },

  /**
   * GET /paywall/subscription
   * Get current user's subscription
   */
  async mySubscription(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const subscription = await prisma.subscription.findFirst({
      where: { userId: user.id, status: 'active' },
      include: { plan: true },
    });

    return { data: subscription || null };
  },
});
