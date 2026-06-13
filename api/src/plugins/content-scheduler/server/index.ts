'use strict';

import prisma from '../../../lib/prisma';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const CRON_INTERVAL_MS = 60000; // Check every minute
const CONFLICT_WINDOW_MS = 300000; // 5-minute conflict window

// ═══════════════════════════════════════════════════════════════
// Background Publisher
// ═══════════════════════════════════════════════════════════════

let cronInterval: ReturnType<typeof setInterval> | null = null;

async function publishDuePosts(strapi: any) {
  const now = new Date();

  try {
    const duePosts = await prisma.scheduledContent.findMany({
      where: {
        status: 'scheduled',
        scheduledAt: { lte: now },
      },
      include: {
        post: { select: { id: true, title: true, slug: true, status: true } },
      },
    });

    for (const scheduled of duePosts) {
      try {
        // Publish the post
        if (scheduled.action === 'publish') {
          await prisma.post.update({
            where: { id: scheduled.postId },
            data: { status: 'published', publishedAt: new Date() },
          });
        } else if (scheduled.action === 'unpublish') {
          await prisma.post.update({
            where: { id: scheduled.postId },
            data: { status: 'draft' },
          });
        } else if (scheduled.action === 'archive') {
          await prisma.post.update({
            where: { id: scheduled.postId },
            data: { status: 'archived' },
          });
        }

        // Mark as completed
        await prisma.scheduledContent.update({
          where: { id: scheduled.id },
          data: { status: 'completed', executedAt: new Date() },
        });

        strapi.log.info(`[ContentScheduler] Executed "${scheduled.action}" for post "${scheduled.post?.title || scheduled.postId}"`);

        // Handle recurring schedules
        if (scheduled.recurringRule) {
          const rule = scheduled.recurringRule as any;
          const nextDate = calculateNextOccurrence(rule, scheduled.scheduledAt);
          if (nextDate) {
            await prisma.scheduledContent.create({
              data: {
                postId: scheduled.postId,
                action: scheduled.action,
                scheduledAt: nextDate,
                status: 'scheduled',
                recurringRule: scheduled.recurringRule,
                timezone: scheduled.timezone,
                createdBy: scheduled.createdBy,
                notes: `Recurring: ${rule.frequency}`,
              },
            });
            strapi.log.info(`[ContentScheduler] Created next recurring schedule for ${scheduled.postId} at ${nextDate.toISOString()}`);
          }
        }
      } catch (err: any) {
        strapi.log.error(`[ContentScheduler] Failed to execute schedule ${scheduled.id}:`, err.message);
        await prisma.scheduledContent.update({
          where: { id: scheduled.id },
          data: { status: 'failed', errorMessage: err.message?.slice(0, 500) },
        }).catch(() => {});
      }
    }
  } catch (err: any) {
    strapi.log.error('[ContentScheduler] Publisher error:', err.message);
  }
}

function calculateNextOccurrence(rule: any, from: Date): Date | null {
  const { frequency, interval = 1, endDate, maxOccurrences } = rule;

  let next: Date;
  switch (frequency) {
    case 'daily':
      next = new Date(from.getTime() + interval * 86400000);
      break;
    case 'weekly':
      next = new Date(from.getTime() + interval * 7 * 86400000);
      break;
    case 'monthly':
      next = new Date(from);
      next.setMonth(next.getMonth() + interval);
      break;
    case 'yearly':
      next = new Date(from);
      next.setFullYear(next.getFullYear() + interval);
      break;
    default:
      return null;
  }

  if (endDate && next > new Date(endDate)) return null;
  return next;
}

function startCronPublisher(strapi: any) {
  if (cronInterval) return;

  cronInterval = setInterval(() => {
    publishDuePosts(strapi);
  }, CRON_INTERVAL_MS);

  cronInterval.unref();
}

// ═══════════════════════════════════════════════════════════════
// Plugin Registration
// ═══════════════════════════════════════════════════════════════

export default ({ strapi }) => ({
  register() {
    // ── Routes ────────────────────────────────────────────────

    strapi.server.routes([
      // Schedule management
      {
        method: 'GET',
        path: '/api/content-scheduler',
        handler: 'contentScheduler.list',
        config: { auth: { scope: ['admin'] } },
      },
      {
        method: 'POST',
        path: '/api/content-scheduler',
        handler: 'contentScheduler.create',
        config: { auth: { scope: ['admin'] } },
      },
      {
        method: 'GET',
        path: '/api/content-scheduler/:id',
        handler: 'contentScheduler.get',
        config: { auth: { scope: ['admin'] } },
      },
      {
        method: 'PUT',
        path: '/api/content-scheduler/:id',
        handler: 'contentScheduler.update',
        config: { auth: { scope: ['admin'] } },
      },
      {
        method: 'DELETE',
        path: '/api/content-scheduler/:id',
        handler: 'contentScheduler.delete',
        config: { auth: { scope: ['admin'] } },
      },
      // Execute immediately
      {
        method: 'POST',
        path: '/api/content-scheduler/:id/execute',
        handler: 'contentScheduler.executeNow',
        config: { auth: { scope: ['admin'] } },
      },
      // Content calendar
      {
        method: 'GET',
        path: '/api/content-scheduler/calendar',
        handler: 'contentScheduler.calendar',
        config: { auth: { scope: ['admin'] } },
      },
      {
        method: 'GET',
        path: '/api/content-scheduler/calendar/:year/:month',
        handler: 'contentScheduler.calendarMonth',
        config: { auth: { scope: ['admin'] } },
      },
      // Conflict detection
      {
        method: 'GET',
        path: '/api/content-scheduler/conflicts',
        handler: 'contentScheduler.detectConflicts',
        config: { auth: { scope: ['admin'] } },
      },
      {
        method: 'POST',
        path: '/api/content-scheduler/check-conflicts',
        handler: 'contentScheduler.checkConflict',
        config: { auth: { scope: ['admin'] } },
      },
      // Recurring newsletter scheduling
      {
        method: 'POST',
        path: '/api/content-scheduler/newsletter',
        handler: 'contentScheduler.scheduleNewsletter',
        config: { auth: { scope: ['admin'] } },
      },
      {
        method: 'GET',
        path: '/api/content-scheduler/newsletter',
        handler: 'contentScheduler.listNewsletterSchedules',
        config: { auth: { scope: ['admin'] } },
      },
      {
        method: 'DELETE',
        path: '/api/content-scheduler/newsletter/:id',
        handler: 'contentScheduler.cancelNewsletterSchedule',
        config: { auth: { scope: ['admin'] } },
      },
      // Stats
      {
        method: 'GET',
        path: '/api/content-scheduler/stats',
        handler: 'contentScheduler.stats',
        config: { auth: { scope: ['admin'] } },
      },
    ]);

    // ── Controllers ───────────────────────────────────────────

    strapi.controller('contentScheduler', () => ({
      /**
       * GET /api/content-scheduler
       * List all scheduled content with filtering and pagination.
       */
      async list(ctx: any) {
        const { status, action, postId, from, to, page = 1, pageSize = 25 } = ctx.query;

        const where: any = {};
        if (status) where.status = status;
        if (action) where.action = action;
        if (postId) where.postId = postId;
        if (from || to) {
          where.scheduledAt = {};
          if (from) where.scheduledAt.gte = new Date(from);
          if (to) where.scheduledAt.lte = new Date(to);
        }

        const [items, total] = await Promise.all([
          prisma.scheduledContent.findMany({
            where,
            include: {
              post: { select: { id: true, title: true, slug: true, status: true } },
            },
            take: Number(pageSize),
            skip: (Number(page) - 1) * Number(pageSize),
            orderBy: { scheduledAt: 'asc' },
          }),
          prisma.scheduledContent.count({ where }),
        ]);

        return ctx.send({
          data: items,
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
       * POST /api/content-scheduler
       * Schedule a post for future publishing.
       * Body: { postId, action: 'publish'|'unpublish'|'archive', scheduledAt, timezone?, notes?, recurringRule? }
       */
      async create(ctx: any) {
        const { postId, action, scheduledAt, timezone = 'UTC', notes, recurringRule } = ctx.request.body;

        if (!postId || !action || !scheduledAt) {
          return ctx.badRequest('postId, action, and scheduledAt are required');
        }

        const validActions = ['publish', 'unpublish', 'archive'];
        if (!validActions.includes(action)) {
          return ctx.badRequest(`Invalid action. Must be: ${validActions.join(', ')}`);
        }

        const scheduledDate = new Date(scheduledAt);
        if (isNaN(scheduledDate.getTime())) {
          return ctx.badRequest('Invalid scheduledAt date');
        }

        if (scheduledDate <= new Date()) {
          return ctx.badRequest('scheduledAt must be in the future');
        }

        // Verify post exists
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) return ctx.notFound('Post not found');

        // Check for conflicts
        const conflictWindowStart = new Date(scheduledDate.getTime() - CONFLICT_WINDOW_MS);
        const conflictWindowEnd = new Date(scheduledDate.getTime() + CONFLICT_WINDOW_MS);
        const conflicts = await prisma.scheduledContent.findMany({
          where: {
            postId,
            status: 'scheduled',
            scheduledAt: { gte: conflictWindowStart, lte: conflictWindowEnd },
          },
        });

        const scheduled = await prisma.scheduledContent.create({
          data: {
            postId,
            action,
            scheduledAt: scheduledDate,
            status: 'scheduled',
            timezone,
            notes: notes || null,
            recurringRule: recurringRule || null,
            createdBy: ctx.state.user?.id,
          },
          include: {
            post: { select: { id: true, title: true, slug: true } },
          },
        });

        strapi.log.info(`[ContentScheduler] Scheduled "${action}" for "${post.title}" at ${scheduledDate.toISOString()}`);

        return ctx.send({
          data: scheduled,
          meta: {
            conflicts: conflicts.length > 0 ? conflicts : undefined,
            message: conflicts.length > 0
              ? `Warning: ${conflicts.length} conflicting schedule(s) within 5-minute window`
              : 'Scheduled successfully',
          },
        }, 201);
      },

      /**
       * GET /api/content-scheduler/:id
       * Get a single scheduled content entry.
       */
      async get(ctx: any) {
        const { id } = ctx.params;

        const scheduled = await prisma.scheduledContent.findUnique({
          where: { id },
          include: {
            post: { select: { id: true, title: true, slug: true, status: true, content: true } },
          },
        });

        if (!scheduled) return ctx.notFound('Scheduled content not found');

        return ctx.send({ data: scheduled });
      },

      /**
       * PUT /api/content-scheduler/:id
       * Update a scheduled content entry.
       */
      async update(ctx: any) {
        const { id } = ctx.params;
        const { action, scheduledAt, timezone, notes, recurringRule } = ctx.request.body;

        const existing = await prisma.scheduledContent.findUnique({ where: { id } });
        if (!existing) return ctx.notFound('Scheduled content not found');
        if (existing.status === 'completed') return ctx.badRequest('Cannot update completed schedule');
        if (existing.status === 'failed') return ctx.badRequest('Cannot update failed schedule — create a new one');

        const data: any = {};
        if (action) data.action = action;
        if (scheduledAt) {
          const d = new Date(scheduledAt);
          if (isNaN(d.getTime())) return ctx.badRequest('Invalid scheduledAt date');
          if (d <= new Date()) return ctx.badRequest('scheduledAt must be in the future');
          data.scheduledAt = d;
        }
        if (timezone) data.timezone = timezone;
        if (notes !== undefined) data.notes = notes;
        if (recurringRule !== undefined) data.recurringRule = recurringRule;

        const updated = await prisma.scheduledContent.update({
          where: { id },
          data,
          include: {
            post: { select: { id: true, title: true, slug: true } },
          },
        });

        return ctx.send({ data: updated });
      },

      /**
       * DELETE /api/content-scheduler/:id
       * Cancel a scheduled content entry.
       */
      async delete(ctx: any) {
        const { id } = ctx.params;

        const existing = await prisma.scheduledContent.findUnique({ where: { id } });
        if (!existing) return ctx.notFound('Scheduled content not found');
        if (existing.status === 'completed') return ctx.badRequest('Cannot delete completed schedule');

        await prisma.scheduledContent.update({
          where: { id },
          data: { status: 'cancelled', cancelledAt: new Date() },
        });

        return ctx.send({ data: { id, status: 'cancelled' } });
      },

      /**
       * POST /api/content-scheduler/:id/execute
       * Execute a scheduled action immediately.
       */
      async executeNow(ctx: any) {
        const { id } = ctx.params;

        const scheduled = await prisma.scheduledContent.findUnique({
          where: { id },
          include: { post: { select: { id: true, title: true, status: true } } },
        });

        if (!scheduled) return ctx.notFound('Scheduled content not found');
        if (scheduled.status === 'completed') return ctx.badRequest('Already executed');
        if (scheduled.status === 'cancelled') return ctx.badRequest('Schedule was cancelled');

        try {
          if (scheduled.action === 'publish') {
            await prisma.post.update({
              where: { id: scheduled.postId },
              data: { status: 'published', publishedAt: new Date() },
            });
          } else if (scheduled.action === 'unpublish') {
            await prisma.post.update({
              where: { id: scheduled.postId },
              data: { status: 'draft' },
            });
          } else if (scheduled.action === 'archive') {
            await prisma.post.update({
              where: { id: scheduled.postId },
              data: { status: 'archived' },
            });
          }

          const updated = await prisma.scheduledContent.update({
            where: { id },
            data: { status: 'completed', executedAt: new Date() },
          });

          strapi.log.info(`[ContentScheduler] Manually executed "${scheduled.action}" for "${scheduled.post?.title}"`);

          return ctx.send({ data: updated, meta: { message: `Action "${scheduled.action}" executed successfully` } });
        } catch (err: any) {
          await prisma.scheduledContent.update({
            where: { id },
            data: { status: 'failed', errorMessage: err.message?.slice(0, 500) },
          }).catch(() => {});
          return ctx.internalServerError('Execution failed: ' + err.message);
        }
      },

      /**
       * GET /api/content-scheduler/calendar
       * Get content calendar — posts grouped by scheduled date.
       * Query: ?from=2025-01-01&to=2025-12-31&status=scheduled
       */
      async calendar(ctx: any) {
        const { from, to, status = 'scheduled' } = ctx.query;

        const fromDate = from ? new Date(from) : new Date();
        const toDate = to ? new Date(to) : new Date(Date.now() + 30 * 86400000); // default 30 days

        const where: any = {
          scheduledAt: { gte: fromDate, lte: toDate },
        };
        if (status !== 'all') where.status = status;

        const items = await prisma.scheduledContent.findMany({
          where,
          include: {
            post: { select: { id: true, title: true, slug: true, status: true, author: { select: { username: true } } } },
          },
          orderBy: { scheduledAt: 'asc' },
        });

        // Group by date (YYYY-MM-DD)
        const calendar: Record<string, any[]> = {};
        for (const item of items) {
          const dateKey = item.scheduledAt.toISOString().split('T')[0];
          if (!calendar[dateKey]) calendar[dateKey] = [];
          calendar[dateKey].push({
            id: item.id,
            postId: item.postId,
            postTitle: item.post?.title,
            postSlug: item.post?.slug,
            postStatus: item.post?.status,
            author: item.post?.author?.username,
            action: item.action,
            scheduledAt: item.scheduledAt,
            status: item.status,
            notes: item.notes,
            recurring: !!item.recurringRule,
          });
        }

        return ctx.send({
          data: calendar,
          meta: {
            from: fromDate.toISOString(),
            to: toDate.toISOString(),
            totalItems: items.length,
            datesWithContent: Object.keys(calendar).length,
          },
        });
      },

      /**
       * GET /api/content-scheduler/calendar/:year/:month
       * Get calendar for a specific month.
       */
      async calendarMonth(ctx: any) {
        const { year, month } = ctx.params;

        const from = new Date(Number(year), Number(month) - 1, 1);
        const to = new Date(Number(year), Number(month), 0, 23, 59, 59);

        const items = await prisma.scheduledContent.findMany({
          where: {
            scheduledAt: { gte: from, lte: to },
            status: { in: ['scheduled', 'completed'] },
          },
          include: {
            post: { select: { id: true, title: true, slug: true, status: true } },
          },
          orderBy: { scheduledAt: 'asc' },
        });

        // Build day-indexed map
        const days: Record<number, any[]> = {};
        for (const item of items) {
          const day = item.scheduledAt.getDate();
          if (!days[day]) days[day] = [];
          days[day].push({
            id: item.id,
            postId: item.postId,
            postTitle: item.post?.title,
            action: item.action,
            scheduledAt: item.scheduledAt,
            status: item.status,
          });
        }

        return ctx.send({
          data: {
            year: Number(year),
            month: Number(month),
            days,
          },
          meta: { totalItems: items.length },
        });
      },

      /**
       * GET /api/content-scheduler/conflicts
       * Detect all scheduling conflicts (overlapping schedules).
       */
      async detectConflicts(ctx: any) {
        const { from, to } = ctx.query;
        const fromDate = from ? new Date(from) : new Date();
        const toDate = to ? new Date(to) : new Date(Date.now() + 7 * 86400000);

        const items = await prisma.scheduledContent.findMany({
          where: {
            status: 'scheduled',
            scheduledAt: { gte: fromDate, lte: toDate },
          },
          include: {
            post: { select: { id: true, title: true } },
          },
          orderBy: { scheduledAt: 'asc' },
        });

        const conflicts: any[] = [];
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            const a = items[i];
            const b = items[j];
            const diff = Math.abs(a.scheduledAt.getTime() - b.scheduledAt.getTime());
            if (diff < CONFLICT_WINDOW_MS) {
              conflicts.push({
                type: 'time_overlap',
                items: [
                  { id: a.id, postTitle: a.post?.title, action: a.action, scheduledAt: a.scheduledAt },
                  { id: b.id, postTitle: b.post?.title, action: b.action, scheduledAt: b.scheduledAt },
                ],
                timeDiffMs: diff,
              });
            }
          }
        }

        return ctx.send({
          data: conflicts,
          meta: {
            totalConflicts: conflicts.length,
            windowMs: CONFLICT_WINDOW_MS,
            scannedItems: items.length,
          },
        });
      },

      /**
       * POST /api/content-scheduler/check-conflicts
       * Check if a proposed schedule would conflict.
       * Body: { postId, scheduledAt, excludeId? }
       */
      async checkConflict(ctx: any) {
        const { postId, scheduledAt, excludeId } = ctx.request.body;

        if (!scheduledAt) return ctx.badRequest('scheduledAt is required');

        const date = new Date(scheduledAt);
        const windowStart = new Date(date.getTime() - CONFLICT_WINDOW_MS);
        const windowEnd = new Date(date.getTime() + CONFLICT_WINDOW_MS);

        const where: any = {
          status: 'scheduled',
          scheduledAt: { gte: windowStart, lte: windowEnd },
        };
        if (postId) where.postId = postId;
        if (excludeId) where.id = { not: excludeId };

        const conflicts = await prisma.scheduledContent.findMany({
          where,
          include: { post: { select: { id: true, title: true } } },
        });

        return ctx.send({
          data: {
            hasConflict: conflicts.length > 0,
            conflicts,
            windowMs: CONFLICT_WINDOW_MS,
          },
        });
      },

      /**
       * POST /api/content-scheduler/newsletter
       * Schedule a recurring newsletter.
       * Body: { newsletterId, scheduledAt, recurringRule: { frequency, interval?, endDate? }, segment? }
       */
      async scheduleNewsletter(ctx: any) {
        const { newsletterId, scheduledAt, recurringRule, segment } = ctx.request.body;

        if (!newsletterId || !scheduledAt || !recurringRule) {
          return ctx.badRequest('newsletterId, scheduledAt, and recurringRule are required');
        }

        const validFrequencies = ['daily', 'weekly', 'monthly', 'yearly'];
        if (!validFrequencies.includes(recurringRule.frequency)) {
          return ctx.badRequest(`Invalid frequency. Must be: ${validFrequencies.join(', ')}`);
        }

        const newsletter = await prisma.newsletter.findUnique({ where: { id: newsletterId } });
        if (!newsletter) return ctx.notFound('Newsletter not found');

        const scheduled = await prisma.scheduledContent.create({
          data: {
            postId: newsletterId, // Reuse postId field for newsletter reference
            action: 'send_newsletter',
            scheduledAt: new Date(scheduledAt),
            status: 'scheduled',
            recurringRule,
            notes: segment ? `Segment: ${JSON.stringify(segment)}` : null,
            createdBy: ctx.state.user?.id,
          },
        });

        strapi.log.info(`[ContentScheduler] Scheduled newsletter "${newsletter.subject}" at ${scheduledAt} (${recurringRule.frequency})`);

        return ctx.send({
          data: scheduled,
          meta: { message: `Newsletter scheduled with ${recurringRule.frequency} recurrence` },
        }, 201);
      },

      /**
       * GET /api/content-scheduler/newsletter
       * List all newsletter schedules.
       */
      async listNewsletterSchedules(ctx: any) {
        const { status } = ctx.query;

        const where: any = { action: 'send_newsletter' };
        if (status) where.status = status;

        const items = await prisma.scheduledContent.findMany({
          where,
          orderBy: { scheduledAt: 'asc' },
        });

        return ctx.send({ data: items });
      },

      /**
       * DELETE /api/content-scheduler/newsletter/:id
       * Cancel a newsletter schedule.
       */
      async cancelNewsletterSchedule(ctx: any) {
        const { id } = ctx.params;

        const existing = await prisma.scheduledContent.findUnique({ where: { id } });
        if (!existing) return ctx.notFound('Schedule not found');
        if (existing.action !== 'send_newsletter') return ctx.badRequest('Not a newsletter schedule');

        await prisma.scheduledContent.update({
          where: { id },
          data: { status: 'cancelled', cancelledAt: new Date() },
        });

        return ctx.send({ data: { id, status: 'cancelled' } });
      },

      /**
       * GET /api/content-scheduler/stats
       * Get scheduler statistics.
       */
      async stats(ctx: any) {
        const now = new Date();

        const [
          totalScheduled,
          totalCompleted,
          totalFailed,
          totalCancelled,
          upcoming24h,
          upcoming7d,
          byAction,
          recentExecutions,
        ] = await Promise.all([
          prisma.scheduledContent.count({ where: { status: 'scheduled' } }),
          prisma.scheduledContent.count({ where: { status: 'completed' } }),
          prisma.scheduledContent.count({ where: { status: 'failed' } }),
          prisma.scheduledContent.count({ where: { status: 'cancelled' } }),
          prisma.scheduledContent.count({
            where: { status: 'scheduled', scheduledAt: { lte: new Date(now.getTime() + 86400000) } },
          }),
          prisma.scheduledContent.count({
            where: { status: 'scheduled', scheduledAt: { lte: new Date(now.getTime() + 7 * 86400000) } },
          }),
          prisma.scheduledContent.groupBy({
            by: ['action'],
            _count: true,
          }),
          prisma.scheduledContent.findMany({
            where: { status: 'completed', executedAt: { gt: new Date(now.getTime() - 86400000) } },
            include: { post: { select: { title: true } } },
            orderBy: { executedAt: 'desc' },
            take: 10,
          }),
        ]);

        return ctx.send({
          data: {
            queue: {
              scheduled: totalScheduled,
              completed: totalCompleted,
              failed: totalFailed,
              cancelled: totalCancelled,
            },
            upcoming: {
              next24h: upcoming24h,
              next7d: upcoming7d,
            },
            byAction: Object.fromEntries(byAction.map(a => [a.action, a._count])),
            recentExecutions,
          },
        });
      },
    }));

    strapi.log.info('📅 Content Scheduler plugin registered');
  },

  bootstrap() {
    startCronPublisher(strapi);
    strapi.log.info('[ContentScheduler] Cron publisher started (60s interval)');
  },
});
