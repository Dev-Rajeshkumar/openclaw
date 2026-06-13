/**
 * Analytics Plugin for Strapi v5
 *
 * Features:
 *   - Dashboard summary endpoint (global KPIs)
 *   - Post-wise deep analytics endpoint
 *   - Content decay detection endpoint
 *   - CSV export endpoint
 *   - Real-time activity feed endpoint
 *   - Integrates with post-analytics-service.ts
 *
 * @module analytics
 */

import prisma from '../../../lib/prisma';
import { getPostAnalyticsService } from '../../../services/post-analytics-service';
import { getAnalyticsService } from '../../../services/analytics-service';

// ═══════════════════════════════════════════════════════════════
// Plugin Registration
// ═══════════════════════════════════════════════════════════════

export default {
  register({ strapi }: any) {
    // ── Routes ────────────────────────────────────────────────

    strapi.server.routes([
      // Dashboard summary
      {
        method: 'GET',
        path: '/api/analytics/dashboard',
        handler: 'analytics.dashboard',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      // Post-wise analytics
      {
        method: 'GET',
        path: '/api/analytics/posts/:postId',
        handler: 'analytics.postAnalytics',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      // Content decay
      {
        method: 'GET',
        path: '/api/analytics/decay',
        handler: 'analytics.decay',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      // CSV export
      {
        method: 'GET',
        path: '/api/analytics/export',
        handler: 'analytics.exportCSV',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      // Real-time activity
      {
        method: 'GET',
        path: '/api/analytics/activity',
        handler: 'analytics.activity',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      // Tracking endpoint (public)
      {
        method: 'POST',
        path: '/api/analytics/track',
        handler: 'analytics.track',
        config: { policies: [], auth: false },
      },
      // Post list with analytics summary
      {
        method: 'GET',
        path: '/api/analytics/posts',
        handler: 'analytics.postsList',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
    ]);

    // ── Controllers ───────────────────────────────────────────

    strapi.controller('analytics', () => ({
      /**
       * Get dashboard summary with KPIs.
       *
       * GET /api/analytics/dashboard?dateFrom=2025-01-01&dateTo=2025-12-31&locale=en
       */
      async dashboard(ctx: any) {
        const { dateFrom, dateTo, locale, authorId } = ctx.query;

        const filters: any = {};
        if (dateFrom) filters.dateFrom = new Date(dateFrom);
        if (dateTo) filters.dateTo = new Date(dateTo);
        if (locale) filters.locale = locale;
        if (authorId) filters.authorId = authorId;

        const service = getAnalyticsService();
        const dashboard = await service.getDashboard(filters);

        return ctx.send({
          data: {
            totals: dashboard.totals,
            newsletter: {
              totalSent: dashboard.newsletterMetrics.totalSent,
              avgOpenRate: dashboard.newsletterMetrics.avgOpenRate,
              avgClickRate: dashboard.newsletterMetrics.avgClickRate,
              subscriberGrowth: dashboard.newsletterMetrics.subscriberGrowth,
            },
            topPosts: dashboard.topPosts,
            topAuthors: dashboard.topAuthors,
            viewsOverTime: dashboard.viewsOverTime,
          },
          meta: { filters },
        });
      },

      /**
       * Get detailed analytics for a single post.
       *
       * GET /api/analytics/posts/:postId
       */
      async postAnalytics(ctx: any) {
        const { postId } = ctx.params;

        const service = getPostAnalyticsService();
        const analytics = await service.getPostAnalytics(postId);

        if (!analytics) return ctx.notFound('Post not found');

        return ctx.send({ data: analytics });
      },

      /**
       * Get content decay analysis for all posts.
       *
       * GET /api/analytics/decay?limit=50
       */
      async decay(ctx: any) {
        const { limit = 50 } = ctx.query;

        const service = getPostAnalyticsService();
        const decayPosts = await service.detectContentDecay();

        return ctx.send({
          data: decayPosts.slice(0, Number(limit)),
          meta: {
            totalDeclining: decayPosts.filter(d => d.decay === 'declining' || d.decay === 'stale').length,
            totalPosts: decayPosts.length,
          },
        });
      },

      /**
       * Export analytics data as CSV.
       *
       * GET /api/analytics/export?type=posts&dateFrom=2025-01-01&dateTo=2025-12-31
       */
      async exportCSV(ctx: any) {
        const { type = 'posts', dateFrom, dateTo, locale, authorId } = ctx.query;

        const validTypes = ['posts', 'comments', 'reactions', 'newsletters', 'views'];
        if (!validTypes.includes(type)) {
          return ctx.badRequest(`Invalid type. Must be: ${validTypes.join(', ')}`);
        }

        const filters: any = {};
        if (dateFrom) filters.dateFrom = new Date(dateFrom);
        if (dateTo) filters.dateTo = new Date(dateTo);
        if (locale) filters.locale = locale;
        if (authorId) filters.authorId = authorId;

        const service = getAnalyticsService();
        const csv = await service.exportCSV(type, filters);

        if (!csv) return ctx.badRequest('No data available for export');

        ctx.set('Content-Type', 'text/csv');
        ctx.set('Content-Disposition', `attachment; filename="analytics-${type}-${Date.now()}.csv"`);
        return ctx.send(csv);
      },

      /**
       * Get real-time activity feed (recent events).
       *
       * GET /api/analytics/activity?limit=50&types=view,comment,reaction,share
       */
      async activity(ctx: any) {
        const { limit = 50, types } = ctx.query;
        const typeFilter = types ? types.split(',') : ['view', 'comment', 'reaction', 'share'];

        const activities: any[] = [];
        const take = Math.ceil(Number(limit) / typeFilter.length) + 5;

        await Promise.all(
          typeFilter.map(async (type: string) => {
            switch (type) {
              case 'view': {
                const views = await prisma.pageView.findMany({
                  take,
                  orderBy: { viewedAt: 'desc' },
                  include: { post: { select: { id: true, title: true, slug: true } } },
                });
                activities.push(...views.map(v => ({
                  type: 'view',
                  timestamp: v.viewedAt,
                  postId: v.postId,
                  postTitle: v.post?.title,
                  visitorId: v.visitorId,
                  ipAddress: v.ipAddress,
                })));
                break;
              }
              case 'comment': {
                const comments = await prisma.comment.findMany({
                  take,
                  orderBy: { createdAt: 'desc' },
                  include: {
                    post: { select: { id: true, title: true } },
                    author: { select: { username: true } },
                  },
                });
                activities.push(...comments.map(c => ({
                  type: 'comment',
                  timestamp: c.createdAt,
                  postId: c.postId,
                  postTitle: c.post?.title,
                  commentId: c.id,
                  author: c.author?.username || c.authorName,
                  content: c.content.slice(0, 100),
                })));
                break;
              }
              case 'reaction': {
                const reactions = await prisma.reaction.findMany({
                  take,
                  orderBy: { createdAt: 'desc' },
                  include: { user: { select: { username: true } } },
                });
                activities.push(...reactions.map(r => ({
                  type: 'reaction',
                  timestamp: r.createdAt,
                  reactionType: r.type,
                  postId: r.postId,
                  commentId: r.commentId,
                  user: r.user?.username,
                })));
                break;
              }
              case 'share': {
                const shares = await prisma.postShare.findMany({
                  take,
                  orderBy: { sharedAt: 'desc' },
                  include: { post: { select: { id: true, title: true } } },
                });
                activities.push(...shares.map(s => ({
                  type: 'share',
                  timestamp: s.sharedAt,
                  platform: s.platform,
                  postId: s.postId,
                  postTitle: s.post?.title,
                })));
                break;
              }
            }
          }),
        );

        // Sort by timestamp descending and limit
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const sliced = activities.slice(0, Number(limit));

        return ctx.send({ data: sliced, meta: { total: sliced.length, types: typeFilter } });
      },

      /**
       * Track analytics events (page views, scroll, shares).
       *
       * POST /api/analytics/track
       * Body: { postId, eventType, data? }
       */
      async track(ctx: any) {
        const { postId, eventType, data } = ctx.request.body;

        if (!postId || !eventType) {
          return ctx.badRequest('Missing required fields: postId, eventType');
        }

        const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for'] || 'unknown';
        const userAgent = ctx.request.headers['user-agent'];
        const referrer = ctx.request.headers['referer'];

        const service = getPostAnalyticsService();

        try {
          switch (eventType) {
            case 'view': {
              await service.trackPageView({
                postId,
                ipAddress: String(ipAddress),
                userAgent: userAgent || '',
                referrer: referrer || '',
                visitorId: data?.visitorId || null,
                userId: ctx.state.user?.id,
                eventType: 'view',
              });

              // Increment post view count
              await prisma.post.update({
                where: { id: postId },
                data: { viewCount: { increment: 1 } },
              });
              break;
            }

            case 'scroll': {
              if (data?.depth !== undefined) {
                await service.trackScroll({
                  postId,
                  ipAddress: String(ipAddress),
                  userAgent: userAgent || '',
                  referrer: referrer || '',
                  visitorId: data?.visitorId || null,
                  userId: ctx.state.user?.id,
                  eventType: 'scroll',
                  depth: data.depth,
                  timeToReach: data.timeToReach || 0,
                });
              }
              break;
            }

            case 'share': {
              if (data?.platform) {
                await service.trackShare(postId, data.platform);
              }
              break;
            }

            case 'time': {
              // Time on page tracking — update engagement record
              if (data?.seconds) {
                await prisma.postEngagement.upsert({
                  where: { postId },
                  create: {
                    postId,
                    avgTimeOnPage: data.seconds,
                  },
                  update: {
                    avgTimeOnPage: data.seconds,
                  },
                });
              }
              break;
            }

            default:
              return ctx.badRequest(`Invalid eventType: ${eventType}`);
          }

          return ctx.send({ data: { status: 'tracked', eventType } });
        } catch (error: any) {
          // Don't break the client — analytics should be silent
          strapi.log.error('[Analytics] Track error:', error.message);
          return ctx.send({ data: { status: 'error', eventType } });
        }
      },

      /**
       * Get posts list with analytics summary.
       *
       * GET /api/analytics/posts?page=1&pageSize=20&sortBy=views&status=published
       */
      async postsList(ctx: any) {
        const { page = 1, pageSize = 20, sortBy = 'viewCount', status = 'published' } = ctx.query;

        const validSortFields = ['viewCount', 'publishedAt', 'createdAt', 'title'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'viewCount';

        const posts = await prisma.post.findMany({
          where: { status },
          select: {
            id: true, title: true, slug: true, status: true,
            viewCount: true, publishedAt: true, createdAt: true,
            _count: { select: { comments: true, reactions: true, shares: true } },
          },
          orderBy: { [sortField]: 'desc' },
          skip: (Number(page) - 1) * Number(pageSize),
          take: Number(pageSize),
        });

        return ctx.send({
          data: posts,
          meta: {
            pagination: {
              page: Number(page),
              pageSize: Number(pageSize),
              total: await prisma.post.count({ where: { status } }),
            },
          },
        });
      },
    }));

    strapi.log.info('📊 Analytics plugin registered');
  },

  bootstrap({ strapi }: any) {
    strapi.log.info('[Analytics] Dashboard, post-wise analytics, and activity feed ready');
  },
};
