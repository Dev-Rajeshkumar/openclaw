'use strict';

import prisma from '../../../lib/prisma';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const ACTIVITY_TYPES = [
  'post_created',
  'post_published',
  'post_updated',
  'post_deleted',
  'post_archived',
  'comment_added',
  'comment_approved',
  'comment_rejected',
  'user_registered',
  'user_updated',
  'subscriber_added',
  'subscriber_removed',
  'newsletter_sent',
  'newsletter_scheduled',
  'form_submitted',
  'media_uploaded',
  'settings_changed',
] as const;

type ActivityType = (typeof ACTIVITY_TYPES)[number];

// ═══════════════════════════════════════════════════════════════
// Activity Logger (called by other plugins/services)
// ═══════════════════════════════════════════════════════════════

async function logActivity(data: {
  type: ActivityType;
  actorId?: string;
  actorType?: string;
  targetType?: string;
  targetId?: string;
  metadata?: any;
  ipAddress?: string;
}) {
  try {
    return await prisma.activityLog.create({
      data: {
        type: data.type,
        actorId: data.actorId || null,
        actorType: data.actorType || 'user',
        targetType: data.targetType || null,
        targetId: data.targetId || null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        ipAddress: data.ipAddress || null,
      },
    });
  } catch (err: any) {
    // Activity logging should never break the main flow
    console.error('[ActivityFeed] Failed to log activity:', err.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// Auto-logging Middleware
// ═══════════════════════════════════════════════════════════════

function registerActivityMiddleware(strapi: any) {
  strapi.server.use(async (ctx: any, next: any) => {
    await next();

    const method = ctx.request.method;
    const url = ctx.request.url;
    const user = ctx.state.user;
    const ip = ctx.request.ip || ctx.request.headers['x-forwarded-for'] || 'unknown';

    // Only log successful mutations
    if (!['POST', 'PUT', 'DELETE'].includes(method)) return;
    if (ctx.status >= 400) return;
    if (!url.startsWith('/api/') || url.includes('activity')) return;

    const pathParts = url.replace('/api/', '').split('/').filter(Boolean);
    const entityType = pathParts[0];
    const entityId = ctx.params.id || ctx.response.body?.data?.id;
    const action = method === 'POST' ? 'create' : method === 'PUT' ? 'update' : 'delete';

    // Map to activity type
    let activityType: ActivityType | null = null;

    if (entityType === 'posts' || entityType === 'post') {
      if (action === 'create') activityType = 'post_created';
      else if (action === 'update') {
        // Check if status changed to published
        const body = ctx.request.body;
        if (body?.status === 'published' || body?.data?.status === 'published') {
          activityType = 'post_published';
        } else {
          activityType = 'post_updated';
        }
      }
      else if (action === 'delete') activityType = 'post_deleted';
    } else if (entityType === 'comments' || entityType === 'comment') {
      if (action === 'create') activityType = 'comment_added';
      else if (action === 'update') {
        const body = ctx.request.body;
        if (body?.status === 'approved' || body?.data?.status === 'approved') {
          activityType = 'comment_approved';
        } else {
          activityType = 'comment_rejected';
        }
      }
    } else if (entityType === 'upload' || entityType === 'media') {
      if (action === 'create') activityType = 'media_uploaded';
    } else if (entityType === 'users' || entityType === 'user') {
      if (action === 'create') activityType = 'user_registered';
      else if (action === 'update') activityType = 'user_updated';
    }

    if (activityType) {
      logActivity({
        type: activityType,
        actorId: user?.id,
        targetType: entityType,
        targetId: entityId ? String(entityId) : undefined,
        metadata: { method, url, action },
        ipAddress: String(ip),
      }).catch(() => {});
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// Plugin Registration
// ═══════════════════════════════════════════════════════════════

export default ({ strapi }) => ({
  register() {
    // Register auto-logging middleware
    registerActivityMiddleware(strapi);

    // ── Routes ────────────────────────────────────────────────

    strapi.server.routes([
      // Global activity feed (admin)
      {
        method: 'GET',
        path: '/api/activity-feed',
        handler: 'activityFeed.getGlobalFeed',
        config: { auth: { scope: ['admin'] } },
      },
      // Per-user activity feed
      {
        method: 'GET',
        path: '/api/activity-feed/user/:userId',
        handler: 'activityFeed.getUserFeed',
        config: { auth: { scope: ['admin'] } },
      },
      // Own activity feed (authenticated user)
      {
        method: 'GET',
        path: '/api/activity-feed/me',
        handler: 'activityFeed.getMyFeed',
        config: { auth: { scope: ['admin'] } },
      },
      // Activity by type
      {
        method: 'GET',
        path: '/api/activity-feed/type/:activityType',
        handler: 'activityFeed.getByType',
        config: { auth: { scope: ['admin'] } },
      },
      // Activity stats
      {
        method: 'GET',
        path: '/api/activity-feed/stats',
        handler: 'activityFeed.stats',
        config: { auth: { scope: ['admin'] } },
      },
      // Activity summary (dashboard widget)
      {
        method: 'GET',
        path: '/api/activity-feed/summary',
        handler: 'activityFeed.summary',
        config: { auth: { scope: ['admin'] } },
      },
      // Manual activity log (for external integrations)
      {
        method: 'POST',
        path: '/api/activity-feed/log',
        handler: 'activityFeed.logManual',
        config: { auth: { scope: ['admin'] } },
      },
      // Available activity types
      {
        method: 'GET',
        path: '/api/activity-feed/types',
        handler: 'activityFeed.getTypes',
        config: { auth: { scope: ['admin'] } },
      },
    ]);

    // ── Controllers ───────────────────────────────────────────

    strapi.controller('activityFeed', () => ({
      /**
       * GET /api/activity-feed
       * Global admin activity feed with pagination and filtering.
       */
      async getGlobalFeed(ctx: any) {
        const {
          types,
          actorId,
          targetType,
          targetId,
          from,
          to,
          page = 1,
          pageSize = 25,
          sortBy = 'createdAt',
          sortOrder = 'desc',
        } = ctx.query;

        const where: any = {};
        if (types) {
          const typeList = types.split(',');
          where.type = { in: typeList };
        }
        if (actorId) where.actorId = actorId;
        if (targetType) where.targetType = targetType;
        if (targetId) where.targetId = targetId;
        if (from || to) {
          where.createdAt = {};
          if (from) where.createdAt.gte = new Date(from);
          if (to) where.createdAt.lte = new Date(to);
        }

        const [activities, total] = await Promise.all([
          prisma.activityLog.findMany({
            where,
            take: Number(pageSize),
            skip: (Number(page) - 1) * Number(pageSize),
            orderBy: { [sortBy]: sortOrder },
          }),
          prisma.activityLog.count({ where }),
        ]);

        // Enrich with actor info
        const enriched = await Promise.all(
          activities.map(async (activity: any) => {
            let actor = null;
            if (activity.actorId) {
              actor = await prisma.user.findUnique({
                where: { id: activity.actorId },
                select: { id: true, username: true, email: true },
              }).catch(() => null);
            }
            return {
              ...activity,
              actor,
              metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
            };
          }),
        );

        return ctx.send({
          data: enriched,
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
       * GET /api/activity-feed/user/:userId
       * Per-user activity feed.
       */
      async getUserFeed(ctx: any) {
        const { userId } = ctx.params;
        const { types, page = 1, pageSize = 25, from, to } = ctx.query;

        const where: any = { actorId: userId };
        if (types) {
          where.type = { in: types.split(',') };
        }
        if (from || to) {
          where.createdAt = {};
          if (from) where.createdAt.gte = new Date(from);
          if (to) where.createdAt.lte = new Date(to);
        }

        const [activities, total] = await Promise.all([
          prisma.activityLog.findMany({
            where,
            take: Number(pageSize),
            skip: (Number(page) - 1) * Number(pageSize),
            orderBy: { createdAt: 'desc' },
          }),
          prisma.activityLog.count({ where }),
        ]);

        const enriched = activities.map((a: any) => ({
          ...a,
          metadata: a.metadata ? JSON.parse(a.metadata) : null,
        }));

        return ctx.send({
          data: enriched,
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
       * GET /api/activity-feed/me
       * Current user's own activity feed.
       */
      async getMyFeed(ctx: any) {
        const user = ctx.state.user;
        if (!user) return ctx.unauthorized();

        const { page = 1, pageSize = 25 } = ctx.query;

        const [activities, total] = await Promise.all([
          prisma.activityLog.findMany({
            where: { actorId: user.id },
            take: Number(pageSize),
            skip: (Number(page) - 1) * Number(pageSize),
            orderBy: { createdAt: 'desc' },
          }),
          prisma.activityLog.count({ where: { actorId: user.id } }),
        ]);

        const enriched = activities.map((a: any) => ({
          ...a,
          metadata: a.metadata ? JSON.parse(a.metadata) : null,
        }));

        return ctx.send({
          data: enriched,
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
       * GET /api/activity-feed/type/:activityType
       * Get activities filtered by type.
       */
      async getByType(ctx: any) {
        const { activityType } = ctx.params;
        const { page = 1, pageSize = 25, from, to } = ctx.query;

        if (!ACTIVITY_TYPES.includes(activityType as any)) {
          return ctx.badRequest(`Invalid activity type. Valid types: ${ACTIVITY_TYPES.join(', ')}`);
        }

        const where: any = { type: activityType };
        if (from || to) {
          where.createdAt = {};
          if (from) where.createdAt.gte = new Date(from);
          if (to) where.createdAt.lte = new Date(to);
        }

        const [activities, total] = await Promise.all([
          prisma.activityLog.findMany({
            where,
            take: Number(pageSize),
            skip: (Number(page) - 1) * Number(pageSize),
            orderBy: { createdAt: 'desc' },
          }),
          prisma.activityLog.count({ where }),
        ]);

        return ctx.send({
          data: activities,
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
       * GET /api/activity-feed/stats
       * Activity statistics and analytics.
       */
      async stats(ctx: any) {
        const { from, to } = ctx.query;
        const dateFilter: any = {};
        if (from || to) {
          dateFilter.createdAt = {};
          if (from) dateFilter.createdAt.gte = new Date(from);
          if (to) dateFilter.createdAt.lte = new Date(to);
        }

        const [byType, byDay, topActors, totalCount] = await Promise.all([
          // Count by type
          prisma.activityLog.groupBy({
            by: ['type'],
            where: dateFilter,
            _count: true,
            orderBy: { _count: { _count: 'desc' } },
          }),
          // Count by day (last 30 days)
          prisma.$queryRaw<{ day: string; count: bigint }[]>`
            SELECT DATE("createdAt") as day, COUNT(*)::bigint as count
            FROM activity_logs
            WHERE "createdAt" >= NOW() - INTERVAL '30 days'
            GROUP BY DATE("createdAt")
            ORDER BY day ASC
          `,
          // Top actors
          prisma.activityLog.groupBy({
            by: ['actorId'],
            where: { ...dateFilter, actorId: { not: null } },
            _count: true,
            orderBy: { _count: { _count: 'desc' } },
            take: 10,
          }),
          // Total
          prisma.activityLog.count({ where: dateFilter }),
        ]);

        // Enrich top actors with user info
        const topActorsEnriched = await Promise.all(
          topActors.map(async (a: any) => {
            const user = a.actorId
              ? await prisma.user.findUnique({
                  where: { id: a.actorId },
                  select: { id: true, username: true, email: true },
                }).catch(() => null)
              : null;
            return {
              actorId: a.actorId,
              activityCount: a._count,
              user,
            };
          }),
        );

        return ctx.send({
          data: {
            total: totalCount,
            byType: Object.fromEntries(byType.map(t => [t.type, t._count])),
            byDay: byDay.map(d => ({ day: d.day, count: Number(d.count) })),
            topActors: topActorsEnriched,
          },
        });
      },

      /**
       * GET /api/activity-feed/summary
       * Activity summary for dashboard widget.
       */
      async summary(ctx: any) {
        const now = new Date();
        const last24h = new Date(now.getTime() - 86400000);
        const last7d = new Date(now.getTime() - 7 * 86400000);

        const [
          total24h,
          total7d,
          recentActivities,
          topTypes24h,
          latestByType,
        ] = await Promise.all([
          prisma.activityLog.count({ where: { createdAt: { gte: last24h } } }),
          prisma.activityLog.count({ where: { createdAt: { gte: last7d } } }),
          prisma.activityLog.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.activityLog.groupBy({
            by: ['type'],
            where: { createdAt: { gte: last24h } },
            _count: true,
            orderBy: { _count: { _count: 'desc' } },
            take: 5,
          }),
          prisma.activityLog.findMany({
            where: { createdAt: { gte: last7d } },
            distinct: ['type'],
            orderBy: { createdAt: 'desc' },
            take: 20,
          }),
        ]);

        return ctx.send({
          data: {
            counts: {
              last24h: total24h,
              last7d: total7d,
            },
            recentActivities,
            topTypes24h: Object.fromEntries(topTypes24h.map((t: any) => [t.type, t._count])),
            latestByType,
          },
        });
      },

      /**
       * POST /api/activity-feed/log
       * Manually log an activity (for external integrations).
       */
      async logManual(ctx: any) {
        const { type, actorId, actorType, targetType, targetId, metadata, ipAddress } = ctx.request.body;

        if (!type) return ctx.badRequest('Activity type is required');
        if (!ACTIVITY_TYPES.includes(type)) {
          return ctx.badRequest(`Invalid type. Must be: ${ACTIVITY_TYPES.join(', ')}`);
        }

        const activity = await prisma.activityLog.create({
          data: {
            type,
            actorId: actorId || ctx.state.user?.id || null,
            actorType: actorType || 'user',
            targetType: targetType || null,
            targetId: targetId || null,
            metadata: metadata ? JSON.stringify(metadata) : null,
            ipAddress: ipAddress || ctx.request.ip || null,
          },
        });

        return ctx.send({ data: activity }, 201);
      },

      /**
       * GET /api/activity-feed/types
       * List all available activity types.
       */
      async getTypes(ctx: any) {
        const counts = await prisma.activityLog.groupBy({
          by: ['type'],
          _count: true,
        });
        const countMap = new Map(counts.map(c => [c.type, c._count]));

        return ctx.send({
          data: ACTIVITY_TYPES.map(type => ({
            type,
            count: countMap.get(type) || 0,
          })),
        });
      },
    }));

    strapi.log.info('📡 Activity Feed plugin registered');
  },

  bootstrap() {
    strapi.log.info('[ActivityFeed] Auto-logging middleware active');
  },
});