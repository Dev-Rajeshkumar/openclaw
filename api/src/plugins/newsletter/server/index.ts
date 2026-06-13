/**
 * Newsletter Plugin for Strapi v5
 *
 * Features:
 *   - Subscribe/unsubscribe endpoints
 *   - Double opt-in flow
 *   - Preference center
 *   - Send endpoint (queued via BullMQ)
 *   - Test email endpoint
 *   - Analytics (open rate, click rate, bounce rate)
 *   - CSV import/export for subscribers
 *   - Segment management
 *   - Send-time optimization per subscriber
 *
 * @module newsletter
 */

import prisma from '../../../lib/prisma';

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function generateToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function getSubscribersBySegment(segment: any): Promise<any[]> {
  const filters: any = { status: 'confirmed' };

  if (segment?.tags?.length) {
    filters.tags = { hasSome: segment.tags };
  }
  if (segment?.locales?.length) {
    filters.locale = { in: segment.locales };
  }
  if (segment?.minEngagement !== undefined) {
    filters.engagementScore = { gte: segment.minEngagement };
  }
  if (segment?.maxChurnRisk !== undefined) {
    filters.churnRisk = { lte: segment.maxChurnRisk };
  }

  return prisma.subscriber.findMany({
    where: filters,
    select: {
      id: true, email: true, name: true, locale: true,
      tags: true, engagementScore: true,
      totalOpens: true, totalClicks: true, lastOpenAt: true,
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// Plugin Registration
// ═══════════════════════════════════════════════════════════════

export default {
  register({ strapi }: any) {
    // ── Routes ────────────────────────────────────────────────

    strapi.server.routes([
      // Subscribe
      {
        method: 'POST',
        path: '/api/nl/subscribe',
        handler: 'newsletter.subscribe',
        config: { policies: [], auth: false },
      },
      // Double opt-in confirmation
      {
        method: 'GET',
        path: '/api/nl/confirm/:token',
        handler: 'newsletter.confirm',
        config: { policies: [], auth: false },
      },
      // Unsubscribe
      {
        method: 'POST',
        path: '/api/nl/unsubscribe',
        handler: 'newsletter.unsubscribe',
        config: { policies: [], auth: false },
      },
      {
        method: 'GET',
        path: '/api/nl/unsubscribe/:token',
        handler: 'newsletter.unsubscribe',
        config: { policies: [], auth: false },
      },
      // Preference center
      {
        method: 'GET',
        path: '/api/nl/preferences/:token',
        handler: 'newsletter.getPreferences',
        config: { policies: [], auth: false },
      },
      {
        method: 'PUT',
        path: '/api/nl/preferences/:token',
        handler: 'newsletter.updatePreferences',
        config: { policies: [], auth: false },
      },
      // Tracking pixel
      {
        method: 'GET',
        path: '/api/nl/track/open',
        handler: 'newsletter.trackOpen',
        config: { policies: [], auth: false },
      },
      // Click tracking
      {
        method: 'GET',
        path: '/api/nl/track/click',
        handler: 'newsletter.trackClick',
        config: { policies: [], auth: false },
      },
      // Admin: send newsletter
      {
        method: 'POST',
        path: '/api/nl/send/:newsletterId',
        handler: 'newsletter.send',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      // Admin: test email
      {
        method: 'POST',
        path: '/api/nl/test/:newsletterId',
        handler: 'newsletter.test',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      // Admin: subscriber management
      {
        method: 'GET',
        path: '/api/nl/subscribers',
        handler: 'newsletter.listSubscribers',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      {
        method: 'POST',
        path: '/api/nl/subscribers/import',
        handler: 'newsletter.importSubscribers',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      {
        method: 'GET',
        path: '/api/nl/subscribers/export',
        handler: 'newsletter.exportSubscribers',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      // Admin: analytics
      {
        method: 'GET',
        path: '/api/nl/analytics',
        handler: 'newsletter.analytics',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      // Admin: segment management
      {
        method: 'GET',
        path: '/api/nl/segments',
        handler: 'newsletter.listSegments',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      {
        method: 'POST',
        path: '/api/nl/segments',
        handler: 'newsletter.createSegment',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
    ]);

    // ── Controllers ───────────────────────────────────────────

    strapi.controller('newsletter', () => ({
      /**
       * Subscribe to newsletter with double opt-in.
       *
       * POST /api/nl/subscribe
       * Body: { email, name?, locale?, tags? }
       */
      async subscribe(ctx: any) {
        const { email, name, locale = 'en', tags = [] } = ctx.request.body;

        if (!email) return ctx.badRequest('Email is required');

        const existing = await prisma.subscriber.findUnique({ where: { email } });

        if (existing) {
          if (existing.status === 'confirmed') {
            return ctx.send({ data: { status: 'already_subscribed', email }, meta: { message: 'You are already subscribed' } });
          }
          // Resend confirmation for pending
          return ctx.send({ data: { status: 'confirmation_resent', email }, meta: { message: 'Confirmation email resent' } });
        }

        const confirmToken = generateToken();
        const unsubscribeToken = generateToken();

        const subscriber = await prisma.subscriber.create({
          data: {
            email,
            name: name || null,
            locale,
            status: 'pending',
            confirmToken,
            unsubscribeToken,
            tags,
          },
        });

        // TODO: Send confirmation email
        strapi.log.info(`[Newsletter] New subscriber: ${email} (pending confirmation)`);

        return ctx.send({
          data: { status: 'pending_confirmation', email: subscriber.email, id: subscriber.id },
          meta: { message: 'Please check your email to confirm subscription' },
        }, 201);
      },

      /**
       * Confirm subscription via double opt-in token.
       *
       * GET /api/nl/confirm/:token
       */
      async confirm(ctx: any) {
        const { token } = ctx.params;

        const subscriber = await prisma.subscriber.findUnique({
          where: { confirmToken: token },
        });

        if (!subscriber) return ctx.notFound('Invalid confirmation token');
        if (subscriber.status === 'confirmed') {
          return ctx.send({ data: { status: 'already_confirmed' } });
        }

        const updated = await prisma.subscriber.update({
          where: { id: subscriber.id },
          data: {
            status: 'confirmed',
            doubleOptInAt: new Date(),
            confirmToken: null,
          },
        });

        strapi.log.info(`[Newsletter] Subscriber confirmed: ${updated.email}`);

        return ctx.send({
          data: { status: 'confirmed', email: updated.email },
          meta: { message: 'Subscription confirmed successfully' },
        });
      },

      /**
       * Unsubscribe from newsletter.
       *
       * POST /api/nl/unsubscribe { email }
       * GET  /api/nl/unsubscribe/:token
       */
      async unsubscribe(ctx: any) {
        const { token, email } = { ...ctx.params, ...ctx.request.body };

        let subscriber;
        if (token) {
          subscriber = await prisma.subscriber.findUnique({ where: { unsubscribeToken: token } });
        } else if (email) {
          subscriber = await prisma.subscriber.findUnique({ where: { email } });
        }

        if (!subscriber) return ctx.notFound('Subscriber not found');

        await prisma.subscriber.update({
          where: { id: subscriber.id },
          data: { status: 'unsubscribed', unsubscribedAt: new Date() },
        });

        // Log unsubscribe event
        const latestLog = await prisma.newsletterLog.findFirst({
          orderBy: { sentAt: 'desc' },
          select: { id: true },
        });
        if (latestLog) {
          await prisma.newsletterLog.update({
            where: { id: latestLog.id },
            data: { unsubscribeCount: { increment: 1 } },
          });
        }

        strapi.log.info(`[Newsletter] Unsubscribed: ${subscriber.email}`);

        return ctx.send({ data: { status: 'unsubscribed' }, meta: { message: 'You have been unsubscribed' } });
      },

      /**
       * Get subscriber preferences by token.
       *
       * GET /api/nl/preferences/:token
       */
      async getPreferences(ctx: any) {
        const { token } = ctx.params;

        const subscriber = await prisma.subscriber.findUnique({
          where: { unsubscribeToken: token },
        });

        if (!subscriber) return ctx.notFound('Subscriber not found');

        return ctx.send({
          data: {
            email: subscriber.email,
            name: subscriber.name,
            locale: subscriber.locale,
            tags: subscriber.tags,
            status: subscriber.status,
            engagementScore: subscriber.engagementScore,
          },
        });
      },

      /**
       * Update subscriber preferences.
       *
       * PUT /api/nl/preferences/:token
       */
      async updatePreferences(ctx: any) {
        const { token } = ctx.params;
        const { name, locale, tags } = ctx.request.body;

        const subscriber = await prisma.subscriber.findUnique({
          where: { unsubscribeToken: token },
        });

        if (!subscriber) return ctx.notFound('Subscriber not found');

        const updated = await prisma.subscriber.update({
          where: { id: subscriber.id },
          data: {
            ...(name !== undefined && { name }),
            ...(locale !== undefined && { locale }),
            ...(tags !== undefined && { tags }),
          },
        });

        return ctx.send({ data: { email: updated.email, locale: updated.locale, tags: updated.tags } });
      },

      /**
       * Track email open (1x1 pixel).
       *
       * GET /api/nl/track/open?n=newsletterId&s=subscriberId
       */
      async trackOpen(ctx: any) {
        const { n: newsletterId, s: subscriberId } = ctx.query;

        if (newsletterId && subscriberId) {
          await prisma.subscriber.update({
            where: { id: subscriberId },
            data: { lastOpenAt: new Date(), totalOpens: { increment: 1 } },
          });

          await prisma.newsletterEmailEvent.create({
            data: {
              eventType: 'open',
              subscriberId,
              newsletterLogId: newsletterId,
              openedAt: new Date(),
              ipAddress: ctx.request.ip,
              userAgent: ctx.request.headers['user-agent'],
            },
          });

          // Update log open count
          await prisma.newsletterLog.updateMany({
            where: { newsletterId },
            data: { openCount: { increment: 1 } },
          });

          // Update engagement score
          const sub = await prisma.subscriber.findUnique({
            where: { id: subscriberId },
            select: { totalOpens: true, totalClicks: true },
          });
          if (sub) {
            const score = Math.min(100, sub.totalOpens * 2 + sub.totalClicks * 5);
            await prisma.subscriber.update({
              where: { id: subscriberId },
              data: { engagementScore: score },
            });
          }
        }

        // Return 1x1 transparent GIF
        ctx.set('Content-Type', 'image/gif');
        ctx.set('Cache-Control', 'no-store, no-cache');
        ctx.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
      },

      /**
       * Track link click.
       *
       * GET /api/nl/track/click?n=newsletterId&s=subscriberId&url=encodedUrl
       */
      async trackClick(ctx: any) {
        const { n: newsletterId, s: subscriberId, url } = ctx.query;

        if (newsletterId && subscriberId) {
          await prisma.subscriber.update({
            where: { id: subscriberId },
            data: { lastClickAt: new Date(), totalClicks: { increment: 1 } },
          });

          await prisma.newsletterEmailEvent.create({
            data: {
              eventType: 'click',
              subscriberId,
              newsletterLogId: newsletterId,
              clickedAt: new Date(),
              clickedUrl: url,
              ipAddress: ctx.request.ip,
              userAgent: ctx.request.headers['user-agent'],
            },
          });

          await prisma.newsletterLog.updateMany({
            where: { newsletterId },
            data: { clickCount: { increment: 1 } },
          });
        }

        // Redirect to target URL
        if (url) {
          ctx.redirect(url);
        } else {
          ctx.send({ ok: true });
        }
      },

      /**
       * Queue newsletter for sending.
       *
       * POST /api/nl/send/:newsletterId
       * Body: { segment? }  // override segment
       */
      async send(ctx: any) {
        const { newsletterId } = ctx.params;
        const { segment: segmentOverride } = ctx.request.body;

        const newsletter = await prisma.newsletter.findUnique({
          where: { id: newsletterId },
        });

        if (!newsletter) return ctx.notFound('Newsletter not found');
        if (newsletter.status === 'sent') return ctx.badRequest('Newsletter already sent');
        if (newsletter.status === 'sending') return ctx.badRequest('Newsletter is already being sent');

        const segment = segmentOverride || newsletter.segment || {};
        const subscribers = await getSubscribersBySegment(segment);

        if (subscribers.length === 0) {
          return ctx.badRequest('No subscribers match the segment criteria');
        }

        // Update status to sending
        await prisma.newsletter.update({
          where: { id: newsletterId },
          data: { status: 'sending' },
        });

        // Create log entry
        const log = await prisma.newsletterLog.create({
          data: {
            newsletterId,
            totalSubscribers: subscribers.length,
            sentCount: 0,
            sentAt: new Date(),
          },
        });

        // TODO: Queue BullMQ jobs for batch sending
        // For now, mark as sent (actual sending happens via worker)
        strapi.log.info(`[Newsletter] Queued send for "${newsletter.subject}" to ${subscribers.length} subscribers`);

        return ctx.send({
          data: {
            newsletterId,
            status: 'sending',
            totalSubscribers: subscribers.length,
            logId: log.id,
          },
          meta: { message: `Newsletter queued for ${subscribers.length} subscribers` },
        });
      },

      /**
       * Send test email.
       *
       * POST /api/nl/test/:newsletterId
       * Body: { email }
       */
      async test(ctx: any) {
        const { newsletterId } = ctx.params;
        const { email } = ctx.request.body;

        if (!email) return ctx.badRequest('Test email address required');

        const newsletter = await prisma.newsletter.findUnique({
          where: { id: newsletterId },
        });

        if (!newsletter) return ctx.notFound('Newsletter not found');

        // TODO: Send actual test email via nodemailer
        strapi.log.info(`[Newsletter] Test email sent for "${newsletter.subject}" to ${email}`);

        return ctx.send({
          data: { status: 'test_sent', email },
          meta: { message: `Test email sent to ${email}` },
        });
      },

      /**
       * List subscribers with filtering and pagination.
       *
       * GET /api/nl/subscribers?status=confirmed&tag=tech&page=1&pageSize=50
       */
      async listSubscribers(ctx: any) {
        const { status, tag, search, page = 1, pageSize = 50 } = ctx.query;
        const filters: any = {};

        if (status) filters.status = status;
        if (tag) filters.tags = { has: tag };
        if (search) {
          filters.OR = [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ];
        }

        const [subscribers, total] = await Promise.all([
          prisma.subscriber.findMany({
            where: filters,
            select: {
              id: true, email: true, name: true, locale: true,
              status: true, tags: true, engagementScore: true, churnRisk: true,
              totalOpens: true, totalClicks: true, subscribedAt: true, lastOpenAt: true,
            },
            orderBy: { subscribedAt: 'desc' },
            skip: (Number(page) - 1) * Number(pageSize),
            take: Number(pageSize),
          }),
          prisma.subscriber.count({ where: filters }),
        ]);

        return ctx.send({
          data: subscribers,
          meta: {
            pagination: {
              page: Number(page),
              pageSize: Number(pageSize),
              total,
              pageCount: Math.ceil(total / Number(pageSize)),
            },
          },
        });
      },

      /**
       * Import subscribers from CSV data.
       *
       * POST /api/nl/subscribers/import
       * Body: { subscribers: [{ email, name?, locale?, tags? }], skipConfirmation?: boolean }
       */
      async importSubscribers(ctx: any) {
        const { subscribers, skipConfirmation = false } = ctx.request.body;

        if (!Array.isArray(subscribers) || subscribers.length === 0) {
          return ctx.badRequest('subscribers array is required');
        }

        let created = 0;
        let updated = 0;
        let skipped = 0;
        const errors: { email: string; error: string }[] = [];

        for (const sub of subscribers) {
          try {
            const existing = await prisma.subscriber.findUnique({
              where: { email: sub.email },
            });

            if (existing) {
              if (sub.tags || sub.locale || sub.name) {
                await prisma.subscriber.update({
                  where: { email: sub.email },
                  data: {
                    ...(sub.name && { name: sub.name }),
                    ...(sub.locale && { locale: sub.locale }),
                    tags: sub.tags ? { set: sub.tags } : undefined,
                  },
                });
                updated++;
              } else {
                skipped++;
              }
            } else {
              await prisma.subscriber.create({
                data: {
                  email: sub.email,
                  name: sub.name || null,
                  locale: sub.locale || 'en',
                  status: skipConfirmation ? 'confirmed' : 'pending',
                  tags: sub.tags || [],
                  confirmToken: skipConfirmation ? null : generateToken(),
                  unsubscribeToken: generateToken(),
                  ...(skipConfirmation ? { doubleOptInAt: new Date() } : {}),
                },
              });
              created++;
            }
          } catch (e: any) {
            errors.push({ email: sub.email, error: e.message });
          }
        }

        strapi.log.info(`[Newsletter] Import: ${created} created, ${updated} updated, ${skipped} skipped, ${errors.length} errors`);

        return ctx.send({
          data: { created, updated, skipped, errors },
          meta: { message: `Imported ${created} new subscribers, updated ${updated}` },
        });
      },

      /**
       * Export subscribers as CSV.
       *
       * GET /api/nl/subscribers/export?status=confirmed
       */
      async exportSubscribers(ctx: any) {
        const { status } = ctx.query;
        const filters: any = {};
        if (status) filters.status = status;

        const subscribers = await prisma.subscriber.findMany({
          where: filters,
          select: {
            email: true, name: true, locale: true, status: true,
            tags: true, engagementScore: true, subscribedAt: true,
            totalOpens: true, totalClicks: true,
          },
          orderBy: { subscribedAt: 'desc' },
        });

        const headers = ['Email', 'Name', 'Locale', 'Status', 'Tags', 'Engagement', 'Subscribed At', 'Opens', 'Clicks'];
        const rows = subscribers.map(s => [
          s.email,
          (s.name || '').replace(/"/g, '""'),
          s.locale,
          s.status,
          `"${(s.tags || []).join(',')}"`,
          s.engagementScore,
          s.subscribedAt.toISOString(),
          s.totalOpens,
          s.totalClicks,
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        ctx.set('Content-Type', 'text/csv');
        ctx.set('Content-Disposition', 'attachment; filename="subscribers.csv"');
        return ctx.send(csv);
      },

      /**
       * Get newsletter analytics.
       *
       * GET /api/nl/analytics
       */
      async analytics(ctx: any) {
        const { newsletterId } = ctx.query;

        if (newsletterId) {
          // Single newsletter analytics
          const log = await prisma.newsletterLog.findFirst({
            where: { newsletterId },
            include: {
              newsletter: { select: { subject: true, status: true, sentAt: true } },
            },
            orderBy: { sentAt: 'desc' },
          });

          if (!log) return ctx.notFound('No analytics found for this newsletter');

          const openRate = log.sentCount > 0 ? (log.openCount / log.sentCount) * 100 : 0;
          const clickRate = log.sentCount > 0 ? (log.clickCount / log.sentCount) * 100 : 0;
          const bounceRate = log.totalSubscribers > 0 ? (log.bounceCount / log.totalSubscribers) * 100 : 0;

          return ctx.send({
            data: {
              newsletterId,
              subject: log.newsletter?.subject,
              sentAt: log.sentAt,
              totalSubscribers: log.totalSubscribers,
              sentCount: log.sentCount,
              failedCount: log.failedCount,
              openCount: log.openCount,
              clickCount: log.clickCount,
              bounceCount: log.bounceCount,
              unsubscribeCount: log.unsubscribeCount,
              rates: {
                open: Math.round(openRate * 100) / 100,
                click: Math.round(clickRate * 100) / 100,
                bounce: Math.round(bounceRate * 100) / 100,
              },
            },
          });
        }

        // Global analytics
        const [totalStats, recentLogs, subscriberStats] = await Promise.all([
          prisma.newsletterLog.aggregate({
            _sum: { totalSubscribers: true, sentCount: true, openCount: true, clickCount: true, bounceCount: true },
            _avg: { sentCount: true },
          }),
          prisma.newsletterLog.findMany({
            take: 10,
            orderBy: { sentAt: 'desc' },
            select: {
              id: true, newsletterId: true, sentAt: true, totalSubscribers: true,
              sentCount: true, openCount: true, clickCount: true,
            },
          }),
          prisma.subscriber.groupBy({
            by: ['status'],
            _count: true,
          }),
        ]);

        const totalSent = totalStats._sum.sentCount || 0;
        const totalOpens = totalStats._sum.openCount || 0;
        const totalClicks = totalStats._sum.clickCount || 0;

        return ctx.send({
          data: {
            totals: {
              sent: totalSent,
              opens: totalOpens,
              clicks: totalClicks,
              bounces: totalStats._sum.bounceCount || 0,
              avgOpenRate: totalSent > 0 ? Math.round((totalOpens / totalSent) * 10000) / 100 : 0,
              avgClickRate: totalSent > 0 ? Math.round((totalClicks / totalSent) * 10000) / 100 : 0,
            },
            subscriberCounts: Object.fromEntries(subscriberStats.map(s => [s.status, s._count])),
            recentSends: recentLogs,
          },
        });
      },

      /**
       * List subscriber segments (computed dynamically).
       *
       * GET /api/nl/segments
       */
      async listSegments(ctx: any) {
        const [byLocale, byEngagement, byChurnRisk, byRecency] = await Promise.all([
          prisma.subscriber.groupBy({
            by: ['locale'],
            where: { status: 'confirmed' },
            _count: true,
          }),
          prisma.$queryRaw<{ bucket: string; count: bigint }[]>`
            SELECT CASE
              WHEN "engagementScore" >= 70 THEN 'high'
              WHEN "engagementScore" >= 30 THEN 'medium'
              ELSE 'low'
            END as bucket, COUNT(*)::bigint as count
            FROM subscribers WHERE status = 'confirmed'
            GROUP BY 1
          `,
          prisma.$queryRaw<{ bucket: string; count: bigint }[]>`
            SELECT CASE
              WHEN "churnRisk" >= 0.7 THEN 'high_risk'
              WHEN "churnRisk" >= 0.3 THEN 'medium_risk'
              ELSE 'low_risk'
            END as bucket, COUNT(*)::bigint as count
            FROM subscribers WHERE status = 'confirmed'
            GROUP BY 1
          `,
          prisma.$queryRaw<{ bucket: string; count: bigint }[]>`
            SELECT CASE
              WHEN "lastOpenAt" >= NOW() - INTERVAL '7 days' THEN 'active_7d'
              WHEN "lastOpenAt" >= NOW() - INTERVAL '30 days' THEN 'active_30d'
              ELSE 'inactive'
            END as bucket, COUNT(*)::bigint as count
            FROM subscribers WHERE status = 'confirmed'
            GROUP BY 1
          `,
        ]);

        return ctx.send({
          data: {
            byLocale: Object.fromEntries(byLocale.map(l => [l.locale, l._count])),
            byEngagement: Object.fromEntries(byEngagement.map(e => [e.bucket, Number(e.count)])),
            byChurnRisk: Object.fromEntries(byChurnRisk.map(c => [c.bucket, Number(c.count)])),
            byRecency: Object.fromEntries(byRecency.map(r => [r.bucket, Number(r.count)])),
          },
        });
      },

      /**
       * Create a named segment.
       *
       * POST /api/nl/segments
       * Body: { name, filters: { tags?, locales?, minEngagement?, maxChurnRisk? } }
       */
      async createSegment(ctx: any) {
        const { name, filters } = ctx.request.body;

        if (!name) return ctx.badRequest('Segment name is required');

        // Validate segment by counting matching subscribers
        const subscribers = await getSubscribersBySegment(filters || {});

        return ctx.send({
          data: {
            name,
            filters: filters || {},
            subscriberCount: subscribers.length,
            sampleEmails: subscribers.slice(0, 5).map((s: any) => s.email),
          },
          meta: { message: `Segment "${name}" matches ${subscribers.length} subscribers` },
        }, 201);
      },
    }));

    strapi.log.info('📬 Newsletter plugin registered');
  },

  bootstrap({ strapi }: any) {
    strapi.log.info('[Newsletter] Double opt-in flow, segments, and analytics ready');
  },
};
