/**
 * Analytics Service — Dashboard Aggregations & Exports
 * 
 * Provides high-level analytics data for the admin dashboard.
 * For per-post deep analytics, see post-analytics-service.ts.
 * 
 * Features:
 *   - Dashboard summary (views, comments, reactions, newsletters)
 *   - Top posts, top authors, engagement trends
 *   - CSV/JSON export
 *   - Date range filtering
 */

import prisma from '../lib/prisma';

interface DashboardFilters {
  dateFrom?: Date;
  dateTo?: Date;
  locale?: string;
  authorId?: string;
}

interface DashboardSummary {
  totals: {
    views: number;
    uniqueViews: number;
    comments: number;
    reactions: number;
    shares: number;
    subscribers: number;
    newsletters: number;
  };
  newsletterMetrics: {
    totalSent: number;
    avgOpenRate: number;
    avgClickRate: number;
    subscriberGrowth: { month: string; count: number }[];
  };
  topPosts: { id: string; title: string; slug: string; views: number; publishedAt: string | null }[];
  topAuthors: { id: string; username: string; postCount: number; totalViews: number }[];
  viewsOverTime: { date: string; views: number }[];
}

export class AnalyticsService {

  /**
   * Get full dashboard summary
   */
  async getDashboard(filters: DashboardFilters = {}): Promise<DashboardSummary> {
    const { dateFrom, dateTo, locale, authorId } = filters;

    const postFilter: any = { status: 'published' };
    if (locale) postFilter.locale = locale;
    if (authorId) postFilter.authorId = authorId;
    if (dateFrom || dateTo) {
      postFilter.publishedAt = {};
      if (dateFrom) postFilter.publishedAt.gte = dateFrom;
      if (dateTo) postFilter.publishedAt.lte = dateTo;
    }

    const [totals, newsletterMetrics, topPosts, topAuthors, viewsOverTime] = await Promise.all([
      this._getTotals(postFilter),
      this._getNewsletterMetrics(),
      this._getTopPosts(postFilter),
      this._getTopAuthors(postFilter),
      this._getViewsOverTime(dateFrom, dateTo),
    ]);

    return {
      totals,
      newsletterMetrics,
      topPosts,
      topAuthors,
      viewsOverTime,
    };
  }

  /**
   * Export data as CSV
   */
  async exportCSV(
    metricType: 'posts' | 'comments' | 'reactions' | 'newsletters' | 'views',
    filters: DashboardFilters = {}
  ): Promise<string> {
    switch (metricType) {
      case 'posts': {
        const posts = await prisma.post.findMany({
          where: { status: 'published' },
          select: {
            id: true, title: true, slug: true, viewCount: true, publishedAt: true,
            readingTimeMinutes: true, contentScore: true,
            _count: { select: { comments: true, reactions: true, shares: true } },
          },
          orderBy: { viewCount: 'desc' },
        });
        const headers = ['ID', 'Title', 'Slug', 'Views', 'Comments', 'Reactions', 'Shares', 'Reading Time', 'AI Score', 'Published At'];
        const rows = posts.map(p => [
          p.id, `"${p.title.replace(/"/g, '""')}"`, p.slug, p.viewCount,
          p._count.comments, p._count.reactions, p._count.shares,
          p.readingTimeMinutes, p.contentScore || 'N/A',
          p.publishedAt?.toISOString().split('T')[0] || '',
        ]);
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      }

      case 'views': {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const views = await prisma.$queryRaw<{ date: string; views: number }[]>`
          SELECT DATE("viewedAt") as date, COUNT(*)::int as views
          FROM page_views WHERE "viewedAt" >= ${thirtyDaysAgo}
          GROUP BY DATE("viewedAt") ORDER BY date ASC
        `;
        return ['Date,Views', ...views.map(v => `${v.date},${v.views}`)].join('\n');
      }

      case 'comments': {
        const comments = await prisma.comment.findMany({
          select: {
            id: true, status: true, createdAt: true, toxicityScore: true, sentimentScore: true,
            post: { select: { title: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 500,
        });
        const headers = ['ID', 'Post', 'Status', 'Toxicity', 'Sentiment', 'Created At'];
        const rows = comments.map(c => [
          c.id, `"${(c.post?.title || '').replace(/"/g, '""')}"`, c.status,
          c.toxicityScore || 0, c.sentimentScore || 0, c.createdAt.toISOString(),
        ]);
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      }

      default:
        return '';
    }
  }

  // ── Private methods ─────────────────────────────────────────

  private async _getTotals(postFilter: any) {
    const [views, uniqueViews, comments, reactions, shares, subscribers, newsletters] = await Promise.all([
      prisma.pageView.count(),
      prisma.pageView.groupBy({ by: ['visitorId'], where: { visitorId: { not: null } } }).then(r => r.length),
      prisma.comment.count({ where: { status: 'approved' } }),
      prisma.reaction.count(),
      prisma.postShare.count(),
      prisma.subscriber.count({ where: { status: 'confirmed' } }),
      prisma.newsletter.count({ where: { status: { in: ['sent', 'sending'] } } }),
    ]);

    return { views, uniqueViews, comments, reactions, shares, subscribers, newsletters };
  }

  private async _getNewsletterMetrics() {
    const logs = await prisma.newsletterLog.findMany({
      select: { sentCount: true, openCount: true, clickCount: true },
    });

    const totalSent = logs.reduce((s, l) => s + l.sentCount, 0);
    const avgOpenRate = logs.length > 0
      ? logs.filter(l => l.sentCount > 0).reduce((s, l) => s + l.openCount / l.sentCount, 0) / logs.length
      : 0;
    const avgClickRate = logs.length > 0
      ? logs.filter(l => l.sentCount > 0).reduce((s, l) => s + l.clickCount / l.sentCount, 0) / logs.length
      : 0;

    const subscriberGrowth = await prisma.$queryRaw<{ month: string; count: number }[]>`
      SELECT TO_CHAR(DATE_TRUNC('month', "subscribedAt"), 'YYYY-MM') as month, COUNT(*)::int as count
      FROM subscribers WHERE "status" = 'confirmed'
      GROUP BY DATE_TRUNC('month', "subscribedAt")
      ORDER BY month DESC LIMIT 12
    `;

    return { totalSent, avgOpenRate: Math.round(avgOpenRate * 10000) / 100, avgClickRate: Math.round(avgClickRate * 10000) / 100, subscriberGrowth };
  }

  private async _getTopPosts(postFilter: any) {
    return prisma.post.findMany({
      where: postFilter,
      select: { id: true, title: true, slug: true, viewCount: true, publishedAt: true },
      orderBy: { viewCount: 'desc' },
      take: 10,
    });
  }

  private async _getTopAuthors(postFilter: any) {
    return prisma.$queryRaw<{ authorId: string; postCount: number; totalViews: number }[]>`
      SELECT "authorId", COUNT(*)::int as "postCount", SUM("viewCount")::int as "totalViews"
      FROM posts
      WHERE "status" = 'published' AND "authorId" IS NOT NULL
      GROUP BY "authorId"
      ORDER BY "totalViews" DESC
      LIMIT 10
    `;
  }

  private async _getViewsOverTime(dateFrom?: Date, dateTo?: Date) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return prisma.$queryRaw<{ date: string; views: number }[]>`
      SELECT DATE("viewedAt") as date, COUNT(*)::int as views
      FROM page_views
      WHERE "viewedAt" >= ${dateFrom || thirtyDaysAgo}
      ${dateTo ? prisma.$queryRaw`AND "viewedAt" <= ${dateTo}` : prisma.$queryRaw``}
      GROUP BY DATE("viewedAt")
      ORDER BY date ASC
    `;
  }
}

let instance: AnalyticsService | null = null;

export function getAnalyticsService(): AnalyticsService {
  if (!instance) instance = new AnalyticsService();
  return instance;
}

export default AnalyticsService;
