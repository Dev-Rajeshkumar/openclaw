/**
 * Post-Wise Deep Analytics Service
 * 
 * Comprehensive per-post analytics:
 *   - Scroll depth, time on page, read completion
 *   - Returning vs new visitors
 *   - Reaction & comment sentiment analysis
 *   - Share velocity, SEO tracking
 *   - AI content scoring, content decay detection
 * 
 * All data stored in PostgreSQL via Prisma.
 */

import prisma from '../lib/prisma';

// ── Types ────────────────────────────────────────────────────

export interface PostAnalyticsOverview {
  postId: string;
  title: string;
  slug: string;
  publishedAt: Date | null;
  views: {
    total: number;
    unique: number;
    returning: number;
    newVisitors: number;
    daily: { date: string; views: number }[];
  };
  engagement: {
    avgTimeOnPage: number;
    readCompletionRate: number;
    bounceRate: number;
    scrollDepth: { pct25: number; pct50: number; pct75: number; pct100: number };
  };
  reactions: {
    total: number;
    byType: Record<string, number>;
    sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  };
  comments: {
    total: number;
    approved: number;
    avgSentiment: number;
    toxicityFlagged: number;
  };
  shares: {
    total: number;
    byPlatform: Record<string, number>;
    velocity: { h24: number; h48: number; h72: number };
  };
  aiScore: number | null;
  contentDecay: 'fresh' | 'stable' | 'declining' | 'stale';
  seo: {
    keywords: { keyword: string; position: number | null }[];
    avgPosition: number | null;
  };
}

export interface TrackingEvent {
  postId: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  visitorId?: string;
  eventType: 'view' | 'scroll' | 'time' | 'share';
  data?: Record<string, any>;
}

// ── Service ───────────────────────────────────────────────────

export class PostAnalyticsService {

  /**
   * Track a page view (fire-and-forget)
   */
  async trackPageView(event: TrackingEvent): Promise<void> {
    await prisma.pageView.create({
      data: {
        postId: event.postId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent || null,
        referrer: event.referrer || null,
        visitorId: event.visitorId || null,
        userId: event.userId || null,
      },
    });

    // Increment view count on Strapi side via direct DB update
    // (Strapi's entity service would be preferred but needs strapi instance)
  }

  /**
   * Track scroll depth
   */
  async trackScroll(event: TrackingEvent & { depth: number; timeToReach: number }): Promise<void> {
    await prisma.scrollEvent.create({
      data: {
        postId: event.postId,
        depth: event.depth,
        timeToReach: event.timeToReach,
        visitorId: event.visitorId || null,
      },
    });
  }

  /**
   * Track a share
   */
  async trackShare(postId: string, platform: string): Promise<void> {
    await prisma.postShare.create({
      data: {
        postId,
        platform,
      },
    });
  }

  /**
   * Get comprehensive analytics for a single post
   */
  async getPostAnalytics(postId: string): Promise<PostAnalyticsOverview | null> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        reactions: true,
        comments: true,
        shares: true,
        seoTracking: true,
        engagement: true,
      },
    });

    if (!post) return null;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Views
    const totalViews = await prisma.pageView.count({ where: { postId } });
    const uniqueVisitors = await prisma.pageView.groupBy({
      by: ['visitorId'],
      where: { postId, visitorId: { not: null } },
    }).then(rows => rows.length);

    const returningVisitors = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(DISTINCT "visitorId") as count
      FROM page_views
      WHERE "postId" = ${postId}
        AND "visitorId" IS NOT NULL
        AND "visitorId" IN (
          SELECT "visitorId" FROM page_views
          WHERE "postId" = ${postId}
          AND "viewedAt" < ${thirtyDaysAgo}
        )
    `.then(rows => rows[0]?.count || 0);

    // Daily views for last 30 days
    const dailyViews = await prisma.$queryRaw<{ date: string; views: number }[]>`
      SELECT DATE("viewedAt") as date, COUNT(*) as views
      FROM page_views
      WHERE "postId" = ${postId} AND "viewedAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("viewedAt")
      ORDER BY date ASC
    `;

    // Scroll depth
    const scrollEvents = await prisma.scrollEvent.groupBy({
      by: ['depth'],
      where: { postId },
      _count: true,
    });
    const scrollCounts = { 25: 0, 50: 0, 75: 0, 100: 0 };
    for (const se of scrollEvents) {
      scrollCounts[se.depth as keyof typeof scrollCounts] = se._count;
    }
    const totalScrollers = scrollCounts[25] || 1;

    // Reactions by type
    const reactionsByType: Record<string, number> = {};
    for (const r of post.reactions) {
      reactionsByType[r.type] = (reactionsByType[r.type] || 0) + 1;
    }

    // Comments
    const approvedComments = post.comments.filter(c => c.status === 'approved');
    const avgSentiment = approvedComments.length > 0
      ? approvedComments.filter(c => c.sentimentScore !== null).reduce((sum, c) => sum + (c.sentimentScore || 0), 0) / approvedComments.length
      : 0;
    const toxicityFlagged = post.comments.filter(c => (c.toxicityScore || 0) > 0.7).length;

    // Shares by platform
    const sharesByPlatform: Record<string, number> = {};
    const now = new Date();
    const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const h48 = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const h72 = new Date(now.getTime() - 72 * 60 * 60 * 1000);

    for (const s of post.shares) {
      sharesByPlatform[s.platform] = (sharesByPlatform[s.platform] || 0) + 1;
    }

    const shares24h = post.shares.filter(s => s.sharedAt >= h24).length;
    const shares48h = post.shares.filter(s => s.sharedAt >= h48).length;
    const shares72h = post.shares.filter(s => s.sharedAt >= h72).length;

    // Content decay detection
    const viewsLast30d = await prisma.pageView.count({
      where: { postId, viewedAt: { gte: thirtyDaysAgo } },
    });
    const viewsPrev60d = await prisma.pageView.count({
      where: {
        postId,
        viewedAt: {
          gte: new Date(thirtyDaysAgo.getTime() - 60 * 24 * 60 * 60 * 1000),
          lt: thirtyDaysAgo,
        },
      },
    });

    let contentDecay: PostAnalyticsOverview['contentDecay'] = 'stable';
    if (!post.publishedAt) {
      contentDecay = 'fresh';
    } else if (viewsPrev60d > 0) {
      const changeRate = (viewsLast30d - viewsPrev60d) / viewsPrev60d;
      if (changeRate > 0.1) contentDecay = 'fresh';
      else if (changeRate > -0.2) contentDecay = 'stable';
      else if (changeRate > -0.5) contentDecay = 'declining';
      else contentDecay = 'stale';
    }

    // SEO keywords
    const seoKeywords = post.seoTracking.map(st => ({
      keyword: st.keyword,
      position: st.position,
    }));
    const avgPosition = seoKeywords.length > 0
      ? seoKeywords.filter(k => k.position !== null).reduce((sum, k) => sum + (k.position || 0), 0) / seoKeywords.length
      : null;

    return {
      postId: post.id,
      title: post.title,
      slug: post.slug,
      publishedAt: post.publishedAt,
      views: {
        total: totalViews,
        unique: uniqueVisitors,
        returning: returningVisitors,
        newVisitors: uniqueVisitors - returningVisitors,
        daily: dailyViews.map(d => ({ date: String(d.date), views: Number(d.views) })),
      },
      engagement: {
        avgTimeOnPage: post.engagement?.avgTimeOnPage || 0,
        readCompletionRate: post.engagement?.readCompletionRate || 0,
        bounceRate: post.engagement?.bounceRate || 0,
        scrollDepth: {
          pct25: scrollCounts[25] / totalScrollers,
          pct50: scrollCounts[50] / totalScrollers,
          pct75: scrollCounts[75] / totalScrollers,
          pct100: scrollCounts[100] / totalScrollers,
        },
      },
      reactions: {
        total: post.reactions.length,
        byType: reactionsByType,
        sentiment: this._calcOverallSentiment(reactionsByType),
      },
      comments: {
        total: post.comments.length,
        approved: approvedComments.length,
        avgSentiment: Math.round(avgSentiment * 100) / 100,
        toxicityFlagged,
      },
      shares: {
        total: post.shares.length,
        byPlatform: sharesByPlatform,
        velocity: { h24: shares24h, h48: shares48h, h72: shares72h },
      },
      aiScore: post.contentScore,
      contentDecay,
      seo: {
        keywords: seoKeywords,
        avgPosition: avgPosition ? Math.round(avgPosition * 10) / 10 : null,
      },
    };
  }

  /**
   * Get dashboard summary across all posts
   */
  async getDashboardSummary(dateFrom?: Date, dateTo?: Date) {
    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = dateFrom;
    if (dateTo) dateFilter.lte = dateTo;

    const [totalViews, totalComments, totalReactions, totalShares, topPosts, subscriberGrowth] = await Promise.all([
      prisma.pageView.count({ where: Object.keys(dateFilter).length ? { viewedAt: dateFilter } : {} }),
      prisma.comment.count({ where: { status: 'approved', ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}) } }),
      prisma.reaction.count({ where: Object.keys(dateFilter).length ? { createdAt: dateFilter } : {} }),
      prisma.postShare.count({ where: Object.keys(dateFilter).length ? { sharedAt: dateFilter } : {} }),
      prisma.post.findMany({
        take: 10,
        orderBy: { viewCount: 'desc' },
        select: { id: true, title: true, slug: true, viewCount: true, status: true, publishedAt: true },
      }),
      prisma.$queryRaw<{ month: string; count: number }[]>`
        SELECT DATE_TRUNC('month', "subscribedAt") as month, COUNT(*)::int as count
        FROM subscribers
        GROUP BY DATE_TRUNC('month', "subscribedAt")
        ORDER BY month DESC
        LIMIT 12
      `,
    ]);

    return {
      totalViews,
      totalComments,
      totalReactions,
      totalShares,
      topPosts,
      subscriberGrowth,
      dateRange: { from: dateFrom, to: dateTo },
    };
  }

  /**
   * Detect content decay — find posts with declining engagement
   */
  async detectContentDecay(): Promise<{ postId: string; title: string; decay: string; views30d: number; viewsPrev60d: number }[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const posts = await prisma.post.findMany({
      where: { status: 'published' },
      select: { id: true, title: true },
    });

    const results = [];
    for (const post of posts) {
      const views30d = await prisma.pageView.count({
        where: { postId: post.id, viewedAt: { gte: thirtyDaysAgo } },
      });
      const viewsPrev60d = await prisma.pageView.count({
        where: {
          postId: post.id,
          viewedAt: { gte: ninetyDaysAgo, lt: thirtyDaysAgo },
        },
      });

      if (viewsPrev60d > 0 && views30d < viewsPrev60d * 0.7) {
        results.push({
          postId: post.id,
          title: post.title,
          decay: views30d < viewsPrev60d * 0.3 ? 'stale' : views30d < viewsPrev60d * 0.5 ? 'declining' : 'stable',
          views30d,
          viewsPrev60d,
        });
      }
    }

    return results.sort((a, b) => b.viewsPrev60d - a.views30d);
  }

  /**
   * Track Newsletter send-time optimization data
   */
  async trackEmailEngagement(subscriberId: string, eventType: 'open' | 'click', timestamp: Date, url?: string) {
    if (eventType === 'open') {
      await prisma.subscriber.update({
        where: { id: subscriberId },
        data: { lastOpenAt: timestamp, totalOpens: { increment: 1 } },
      });
    } else if (eventType === 'click') {
      await prisma.subscriber.update({
        where: { id: subscriberId },
        data: { lastClickAt: timestamp, totalClicks: { increment: 1 } },
      });
    }
  }

  /**
   * Get optimal send time for a subscriber (based on their open history)
   */
  async getOptimalSendTime(subscriberId: string): Promise<number> {
    const events = await prisma.newsletterEmailEvent.findMany({
      where: { subscriberId, eventType: 'open', openedAt: { not: null } },
      select: { openedAt: true },
      take: 50,
      orderBy: { openedAt: 'desc' },
    });

    if (events.length < 5) return 9; // Default 9 AM

    // Calculate average preferred hour
    const avgHour = events.reduce((sum, e) => sum + (e.openedAt!.getHours()), 0) / events.length;
    return Math.round(avgHour);
  }

  // ── Private helpers ─────────────────────────────────────────

  private _calcOverallSentiment(reactions: Record<string, number>): 'positive' | 'neutral' | 'negative' | 'mixed' {
    const positive = (reactions['like'] || 0) + (reactions['love'] || 0) + (reactions['laugh'] || 0);
    const negative = (reactions['sad'] || 0) + (reactions['angry'] || 0);
    const total = Object.values(reactions).reduce((a, b) => a + b, 0);
    if (total === 0) return 'neutral';
    if (positive / total > 0.6) return 'positive';
    if (negative / total > 0.4) return 'negative';
    return 'mixed';
  }
}

// Singleton
let instance: PostAnalyticsService | null = null;

export function getPostAnalyticsService(): PostAnalyticsService {
  if (!instance) instance = new PostAnalyticsService();
  return instance;
}

export default PostAnalyticsService;
