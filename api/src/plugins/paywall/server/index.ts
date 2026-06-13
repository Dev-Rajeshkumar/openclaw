/**
 * Paywall Plugin for Strapi v5
 *
 * Features:
 *   - Subscription plan CRUD
 *   - Subscribe/unsubscribe endpoints
 *   - Metered access check middleware
 *   - Teaser content generation (first N paragraphs)
 *   - Coupon validation endpoint
 *   - Referral tracking endpoint
 *
 * @module paywall
 */

import prisma from '../../../lib/prisma';

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a teaser excerpt from post content (first N paragraphs).
 */
function generateTeaser(content: string, paragraphCount = 2): string {
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
  const teaser = paragraphs.slice(0, paragraphCount).join('\n\n');
  return teaser + (paragraphs.length > paragraphCount ? '\n\n…' : '');
}

/**
 * Check if a user has active subscription.
 */
async function hasActiveSubscription(userId: string): Promise<boolean> {
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'active',
      currentPeriodEnd: { gt: new Date() },
    },
  });
  return !!sub;
}

/**
 * Get user's plan features.
 */
async function getUserPlanFeatures(userId: string): Promise<Record<string, any>> {
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'active',
      currentPeriodEnd: { gt: new Date() },
    },
    include: { plan: true },
  });

  if (!sub) return { freePostsPerMeter: 3, unlimitedAccess: false };
  return (sub.plan.features as Record<string, any>) || {};
}

/**
 * Check metered access (free articles per month).
 */
async function checkMeteredAccess(userId: string, features: Record<string, any>): Promise<{ allowed: boolean; remaining: number }> {
  const limit = features.freePostsPerMeter || 0;
  if (limit === -1 || features.unlimitedAccess) {
    return { allowed: true, remaining: -1 };
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const accessCount = await prisma.postAccessLog.count({
    where: {
      userId,
      accessType: { in: ['full', 'paywalled'] },
      accessedAt: { gte: startOfMonth },
    },
  });

  return {
    allowed: accessCount < limit,
    remaining: Math.max(0, limit - accessCount),
  };
}

// ═══════════════════════════════════════════════════════════════
// Plugin Registration
// ═══════════════════════════════════════════════════════════════

export default {
  register({ strapi }: any) {
    // ── Routes ────────────────────────────────────────────────

    strapi.server.routes([
      // Plans (public read)
      {
        method: 'GET',
        path: '/api/paywall/plans',
        handler: 'paywall.plans',
        config: { policies: [], auth: false },
      },
      // Admin: Plan CRUD
      {
        method: 'POST',
        path: '/api/paywall/plans',
        handler: 'paywall.createPlan',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      {
        method: 'PUT',
        path: '/api/paywall/plans/:id',
        handler: 'paywall.updatePlan',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      {
        method: 'DELETE',
        path: '/api/paywall/plans/:id',
        handler: 'paywall.deletePlan',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      // Subscribe
      {
        method: 'POST',
        path: '/api/paywall/subscribe',
        handler: 'paywall.subscribe',
        config: { policies: [], auth: { scope: ['authenticated'] } },
      },
      // Cancel subscription
      {
        method: 'POST',
        path: '/api/paywall/unsubscribe',
        handler: 'paywall.unsubscribe',
        config: { policies: [], auth: { scope: ['authenticated'] } },
      },
      // Current subscription status
      {
        method: 'GET',
        path: '/api/paywall/status',
        handler: 'paywall.status',
        config: { policies: [], auth: { scope: ['authenticated'] } },
      },
      // Access check for a post
      {
        method: 'GET',
        path: '/api/paywall/access/:postId',
        handler: 'paywall.checkAccess',
        config: { policies: [], auth: { scope: ['authenticated'] } },
      },
      // Teaser content
      {
        method: 'GET',
        path: '/api/paywall/teaser/:postId',
        handler: 'paywall.teaser',
        config: { policies: [], auth: false },
      },
      // Coupon validation
      {
        method: 'POST',
        path: '/api/paywall/coupon/validate',
        handler: 'paywall.validateCoupon',
        config: { policies: [], auth: { scope: ['authenticated'] } },
      },
      // Referral
      {
        method: 'POST',
        path: '/api/paywall/referral',
        handler: 'paywall.createReferral',
        config: { policies: [], auth: { scope: ['authenticated'] } },
      },
      {
        method: 'GET',
        path: '/api/paywall/referral/stats',
        handler: 'paywall.referralStats',
        config: { policies: [], auth: { scope: ['authenticated'] } },
      },
      {
        method: 'POST',
        path: '/api/paywall/referral/apply/:code',
        handler: 'paywall.applyReferral',
        config: { policies: [], auth: false },
      },
    ]);

    // ── Controllers ───────────────────────────────────────────

    strapi.controller('paywall', () => ({
      /**
       * List active subscription plans.
       *
       * GET /api/paywall/plans
       */
      async plans(ctx: any) {
        const plans = await prisma.subscriptionPlan.findMany({
          where: { isActive: true },
          orderBy: { price: 'asc' },
        });

        return ctx.send({ data: plans });
      },

      /**
       * Create a subscription plan (admin).
       *
       * POST /api/paywall/plans
       * Body: { name, slug, description?, price, currency?, interval, features? }
       */
      async createPlan(ctx: any) {
        const { name, slug, description, price, currency = 'USD', interval, features } = ctx.request.body;

        if (!name || !slug || price === undefined || !interval) {
          return ctx.badRequest('Missing required fields: name, slug, price, interval');
        }

        if (!['monthly', 'yearly'].includes(interval)) {
          return ctx.badRequest('Interval must be "monthly" or "yearly"');
        }

        const plan = await prisma.subscriptionPlan.create({
          data: {
            name,
            slug,
            description: description || null,
            price,
            currency,
            interval,
            features: features || {},
            isActive: true,
          },
        });

        return ctx.send({ data: plan }, 201);
      },

      /**
       * Update a subscription plan (admin).
       *
       * PUT /api/paywall/plans/:id
       */
      async updatePlan(ctx: any) {
        const { id } = ctx.params;
        const { name, description, price, currency, interval, features, isActive } = ctx.request.body;

        const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
        if (!plan) return ctx.notFound('Plan not found');

        const updated = await prisma.subscriptionPlan.update({
          where: { id },
          data: {
            ...(name && { name }),
            ...(description !== undefined && { description }),
            ...(price !== undefined && { price }),
            ...(currency && { currency }),
            ...(interval && { interval }),
            ...(features && { features }),
            ...(isActive !== undefined && { isActive }),
          },
        });

        return ctx.send({ data: updated });
      },

      /**
       * Delete a subscription plan (admin).
       *
       * DELETE /api/paywall/plans/:id
       */
      async deletePlan(ctx: any) {
        const { id } = ctx.params;

        const plan = await prisma.subscriptionPlan.findUnique({
          where: { id },
          include: { _count: { select: { subscriptions: true } } },
        });

        if (!plan) return ctx.notFound('Plan not found');
        if (plan._count.subscriptions > 0) {
          return ctx.badRequest('Cannot delete plan with active subscriptions. Deactivate it instead.');
        }

        await prisma.subscriptionPlan.delete({ where: { id } });
        return ctx.send({ data: { id }, meta: { deleted: true } });
      },

      /**
       * Subscribe to a plan.
       *
       * POST /api/paywall/subscribe
       * Body: { planId, couponCode? }
       */
      async subscribe(ctx: any) {
        const userId = ctx.state.user?.id;
        const { planId, couponCode } = ctx.request.body;

        if (!planId) return ctx.badRequest('planId is required');

        const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
        if (!plan || !plan.isActive) return ctx.notFound('Plan not found or inactive');

        // Check existing subscription
        const existing = await prisma.subscription.findFirst({
          where: { userId, status: 'active' },
        });

        if (existing) {
          return ctx.badRequest('You already have an active subscription. Please cancel it first.');
        }

        // Calculate period dates
        const now = new Date();
        const periodEnd = new Date(now);
        if (plan.interval === 'monthly') {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        } else {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        }

        let price = plan.price;
        if (couponCode) {
          const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
          if (coupon && coupon.isActive && coupon.validFrom <= now && (!coupon.validUntil || coupon.validUntil >= now)) {
            if (coupon.maxUses === null || coupon.usedCount < coupon.maxUses) {
              if (coupon.discountType === 'percentage') {
                price = price * (1 - coupon.discountValue / 100);
              } else {
                price = Math.max(0, price - coupon.discountValue);
              }
              await prisma.coupon.update({
                where: { id: coupon.id },
                data: { usedCount: { increment: 1 } },
              });
            }
          }
        }

        const subscription = await prisma.subscription.create({
          data: {
            userId,
            planId,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          },
          include: { plan: true },
        });

        strapi.log.info(`[Paywall] User ${userId} subscribed to plan "${plan.name}"`);

        // TODO: Process payment via Stripe
        return ctx.send({
          data: {
            subscription,
            payment: {
              amount: price,
              currency: plan.currency,
              interval: plan.interval,
            },
          },
          meta: { message: `Subscribed to ${plan.name}` },
        }, 201);
      },

      /**
       * Cancel subscription.
       *
       * POST /api/paywall/unsubscribe
       */
      async unsubscribe(ctx: any) {
        const userId = ctx.state.user?.id;

        const subscription = await prisma.subscription.findFirst({
          where: { userId, status: 'active' },
          include: { plan: true },
        });

        if (!subscription) return ctx.notFound('No active subscription found');

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { cancelAtPeriodEnd: true },
        });

        strapi.log.info(`[Paywall] User ${userId} cancelled subscription (period end: ${subscription.currentPeriodEnd})`);

        return ctx.send({
          data: {
            status: 'cancelling',
            periodEnd: subscription.currentPeriodEnd,
            plan: subscription.plan.name,
          },
          meta: { message: 'Subscription will be cancelled at end of billing period' },
        });
      },

      /**
       * Get current subscription status.
       *
       * GET /api/paywall/status
       */
      async status(ctx: any) {
        const userId = ctx.state.user?.id;

        const subscription = await prisma.subscription.findFirst({
          where: { userId, status: 'active' },
          include: { plan: true },
        });

        const features = await getUserPlanFeatures(userId);

        return ctx.send({
          data: {
            subscribed: !!subscription,
            subscription: subscription ? {
              plan: subscription.plan.name,
              status: subscription.status,
              currentPeriodEnd: subscription.currentPeriodEnd,
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            } : null,
            features,
          },
        });
      },

      /**
       * Check if user can access a specific post.
       *
       * GET /api/paywall/access/:postId
       */
      async checkAccess(ctx: any) {
        const userId = ctx.state.user?.id;
        const { postId } = ctx.params;

        const post = await prisma.post.findUnique({
          where: { id: postId },
          select: { id: true, title: true, content: true, featured: true, status: true },
        });

        if (!post) return ctx.notFound('Post not found');
        if (post.status !== 'published') return ctx.badRequest('Post is not published');

        const features = await getUserPlanFeatures(userId);

        // Free posts or unlimited access
        if (features.unlimitedAccess || post.featured === false) {
          // Log access
          await prisma.postAccessLog.create({
            data: { postId, userId, accessType: 'full' },
          });
          return ctx.send({
            data: { access: 'full', postId },
          });
        }

        // Check metered access
        const meterResult = await checkMeteredAccess(userId, features);

        // Determine access type
        let accessType: string;
        if (await hasActiveSubscription(userId) || meterResult.allowed) {
          accessType = 'full';
        } else {
          accessType = 'teaser';
        }

        // Log access
        await prisma.postAccessLog.create({
          data: { postId, userId, accessType: accessType as any },
        });

        return ctx.send({
          data: {
            access: accessType,
            postId,
            remaining: meterResult.remaining,
            teaserAvailable: accessType === 'teaser',
          },
        });
      },

      /**
       * Get teaser content for a paywalled post.
       *
       * GET /api/paywall/teaser/:postId
       */
      async teaser(ctx: any) {
        const { postId } = ctx.params;

        const post = await prisma.post.findUnique({
          where: { id: postId },
          select: { id: true, title: true, content: true, excerpt: true, status: true },
        });

        if (!post) return ctx.notFound('Post not found');
        if (post.status !== 'published') return ctx.badRequest('Post is not published');

        const teaserContent = post.excerpt || generateTeaser(post.content, 2);

        return ctx.send({
          data: {
            id: post.id,
            title: post.title,
            excerpt: teaserContent,
            teaser: true,
          },
          meta: {
            message: 'Subscribe to read the full article',
            subscribeUrl: '/api/paywall/plans',
          },
        });
      },

      /**
       * Validate a coupon code.
       *
       * POST /api/paywall/coupon/validate
       * Body: { code }
       */
      async validateCoupon(ctx: any) {
        const userId = ctx.state.user?.id;
        const { code } = ctx.request.body;

        if (!code) return ctx.badRequest('Coupon code is required');

        const coupon = await prisma.coupon.findUnique({ where: { code } });

        if (!coupon) return ctx.notFound('Coupon not found');

        const now = new Date();
        const isValid =
          coupon.isActive &&
          coupon.validFrom <= now &&
          (!coupon.validUntil || coupon.validUntil >= now) &&
          (coupon.maxUses === null || coupon.usedCount < coupon.maxUses);

        if (!isValid) {
          return ctx.send({
            data: { valid: false, code: coupon.code },
            meta: { message: 'Coupon is expired or has reached its usage limit' },
          });
        }

        return ctx.send({
          data: {
            valid: true,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            remainingUses: coupon.maxUses ? coupon.maxUses - coupon.usedCount : null,
          },
        });
      },

      /**
       * Create a referral.
       *
       * POST /api/paywall/referral
       * Body: { referredEmail }
       */
      async createReferral(ctx: any) {
        const userId = ctx.state.user?.id;
        const { referredEmail } = ctx.request.body;

        if (!referredEmail) return ctx.badRequest('referredEmail is required');

        // Generate unique referral code
        let referralCode = `REF-${userId?.slice(0, 6)}-${Date.now().toString(36)}`;

        // Check if email already has an account
        const referredUser = await prisma.user.findUnique({
          where: { email: referredEmail },
        });

        const referral = await prisma.referral.create({
          data: {
            referralCode,
            referrerId: userId,
            referredEmail,
            referredUserId: referredUser?.id || null,
            status: 'pending',
            rewardType: 'discount',
            rewardValue: 10,
          },
        });

        strapi.log.info(`[Paywall] Referral created: ${referralCode} → ${referredEmail}`);

        return ctx.send({
          data: {
            referralCode: referral.referralCode,
            referredEmail,
            status: 'pending',
          },
          meta: { message: `Referral sent to ${referredEmail}` },
        }, 201);
      },

      /**
       * Get referral stats for current user.
       *
       * GET /api/paywall/referral/stats
       */
      async referralStats(ctx: any) {
        const userId = ctx.state.user?.id;

        const [totalReferrals, convertedReferrals, pendingReferrals] = await Promise.all([
          prisma.referral.count({ where: { referrerId: userId } }),
          prisma.referral.count({ where: { referrerId: userId, status: 'converted' } }),
          prisma.referral.count({ where: { referrerId: userId, status: 'pending' } }),
        ]);

        const conversionRate = totalReferrals > 0
          ? Math.round((convertedReferrals / totalReferrals) * 10000) / 100
          : 0;

        return ctx.send({
          data: {
            totalReferrals,
            convertedReferrals,
            pendingReferrals,
            conversionRate,
          },
        });
      },

      /**
       * Apply a referral code (public — used during signup).
       *
       * POST /api/paywall/referral/apply/:code
       */
      async applyReferral(ctx: any) {
        const { code } = ctx.params;

        try {
          const referral = await prisma.referral.findUnique({
            where: { referralCode: code },
            include: { plan: false },
          });

          if (!referral) return ctx.notFound('Invalid referral code');
          if (referral.status === 'converted') return ctx.badRequest('Referral already used');
          if (referral.status === 'expired') return ctx.badRequest('Referral has expired');

          return ctx.send({
            data: {
              valid: true,
              code: referral.referralCode,
              rewardType: referral.rewardType,
              rewardValue: referral.rewardValue,
            },
            meta: { message: 'Referral applied! Complete signup to claim your reward.' },
          });
        } catch (e) {
          return ctx.notFound('Invalid referral code');
        }
      },
    }));

    strapi.log.info('💰 Paywall plugin registered');
  },

  bootstrap({ strapi }: any) {
    strapi.log.info('[Paywall] Plans, subscriptions, coupons, and referrals ready');
  },
};
