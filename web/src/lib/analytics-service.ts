/**
 * Analytics Service — Server-side dashboard aggregations
 */

import prisma from './prisma';

export interface DashboardData {
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
  topAuthors: { authorId: string; username: string; postCount: number; totalViews: number }[];
  viewsOverTime: { date: string; views: number }[];
}

export class AnalyticsService {
  async getDashboard(filters: { dateFrom?: Date; dateTo?: Date } = {}): Promise<DashboardData> {
    const { dateFrom, dateTo } = filters;

    const [views, uniqueViews, comments, reactions, shares, subscribers, subscriberGrowth] = await Promise.all([
      prisma.pageView.count({
        where: Object.keys(filters).length ? { viewedAt: { gte: dateFrom, lte: dateTo } } : {},
      }),
      prisma.pageView.groupBy({
        by: ['visitorId'],
        where: { visitorId: { not: null } },
      }).then(r => r.length),
      prisma.comment.count({ where: { status: 'approved' } }),
      prisma.reaction.count(),
      prisma.postShare.count(),
      prisma.subscriber.count({ where: { status: 'confirmed' } }),
      prisma.$queryRaw<{ month: string; count: number }[]>`
        SELECT TO_CHAR(DATE_TRUNC('month', "subscribedAt"), 'YYYY-MM') as month, COUNT(*)::int as count
        FROM subscribers WHERE "status" = 'confirmed'
        GROUP BY DATE_TRUNC('month', "subscribedAt") ORDER BY month DESC LIMIT 12
      `,
    ]);

    const topPosts = await prisma.post.findMany({
      where: { status: 'published' },
      select: { id: true, title: true, slug: true, viewCount: true, publishedAt: true },
      orderBy: { viewCount: 'desc' },
      take: 10,
    });

    const viewsOverTime = await prisma.$queryRaw<{ date: string; views: number }[]>`
      SELECT TO_CHAR(DATE("viewedAt"), 'YYYY-MM-DD') as date, COUNT(*)::int as views
      FROM page_views WHERE "viewedAt" >= ${dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
      GROUP BY DATE("viewedAt") ORDER BY date ASC
    `;

    return {
      totals: { views, uniqueViews, comments, reactions, shares, subscribers, newsletters: 0 },
      newsletterMetrics: { totalSent: 0, avgOpenRate: 0, avgClickRate: 0, subscriberGrowth },
      topPosts,
      topAuthors: [],
      viewsOverTime,
    };
  }
}
