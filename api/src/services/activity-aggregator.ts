/**
 * Activity Aggregation Service
 *
 * Pre-computes analytics materialized views for fast dashboard queries.
 * Runs on a schedule (every 5 minutes) to keep stats fresh.
 *
 * Aggregates:
 *   - Hourly views per post
 *   - Daily views per post
 *   - Weekly/monthly rollups
 *   - Top posts by period
 *   - Engagement trends
 */

import prisma from '../lib/prisma';

export class ActivityAggregator {

  /**
   * Run all aggregations
   */
  async runAll(): Promise<void> {
    console.log('[Aggregator] Starting activity aggregation...');
    const start = Date.now();

    try {
      await this.aggregateHourlyViews();
      await this.aggregateDailyViews();
      await this.aggregatePostEngagement();
      await this.updateContentScores();

      const elapsed = Date.now() - start;
      console.log(`[Aggregator] Complete in ${elapsed}ms`);
    } catch (err: any) {
      console.error('[Aggregator] Error:', err.message);
    }
  }

  /**
   * Aggregate hourly page views per post
   */
  async aggregateHourlyViews(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Get view counts per post in the last hour
    const hourlyViews = await prisma.$queryRaw<{ post_id: string; view_count: bigint }[]>`
      SELECT "postId" as post_id, COUNT(*)::bigint as view_count
      FROM page_views
      WHERE "viewedAt" >= ${oneHourAgo}
      GROUP BY "postId"
      ORDER BY view_count DESC
      LIMIT 100
    `;

    // Store in engagement table (upsert)
    for (const row of hourlyViews) {
      await prisma.postEngagement.upsert({
        where: { postId: String(row.post_id) },
        create: { postId: String(row.post_id) },
        update: {}, // Just ensure it exists
      });
    }
  }

  /**
   * Aggregate daily views per post
   */
  async aggregateDailyViews(): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const dailyViews = await prisma.$queryRaw<{ post_id: string; views: bigint; unique_visitors: bigint }[]>`
      SELECT
        "postId" as post_id,
        COUNT(*)::bigint as views,
        COUNT(DISTINCT "ipAddress")::bigint as unique_visitors
      FROM page_views
      WHERE "viewedAt" >= ${oneDayAgo}
      GROUP BY "postId"
    `;

    // Update post view counts
    for (const row of dailyViews) {
      await prisma.post.update({
        where: { id: String(row.post_id) },
        data: { viewCount: Number(row.views) },
      }).catch(() => {});
    }
  }

  /**
   * Aggregate engagement metrics per post
   */
  async aggregatePostEngagement(): Promise<void> {
    // Calculate avg time on page from recent data
    const posts = await prisma.post.findMany({
      where: { status: 'published' },
      select: { id: true },
      take: 100,
    });

    for (const post of posts) {
      // Scroll depth distribution
      const scrollStats = await prisma.$queryRaw<{ depth: number; count: bigint }[]>`
        SELECT depth, COUNT(*)::bigint as count
        FROM scroll_events
        WHERE "postId" = ${post.id}
        GROUP BY depth
        ORDER BY depth
      `;

      const totalScrollers = scrollStats.reduce((sum, s) => sum + Number(s.count), 0);
      if (totalScrollers === 0) continue;

      const getDepth = (d: number) => scrollStats.find(s => s.depth === d)?.count || 0;

      await prisma.postEngagement.upsert({
        where: { postId: post.id },
        create: {
          postId: post.id,
          scroll25pct: Number(getDepth(25)) / totalScrollers,
          scroll50pct: Number(getDepth(50)) / totalScrollers,
          scroll75pct: Number(getDepth(75)) / totalScrollers,
          scroll100pct: Number(getDepth(100)) / totalScrollers,
        },
        update: {
          scroll25pct: Number(getDepth(25)) / totalScrollers,
          scroll50pct: Number(getDepth(50)) / totalScrollers,
          scroll75pct: Number(getDepth(75)) / totalScrollers,
          scroll100pct: Number(getDepth(100)) / totalScrollers,
        },
      });
    }
  }

  /**
   * Update AI content scores for posts without scores
   */
  async updateContentScores(): Promise<void> {
    const unscored = await prisma.post.findMany({
      where: { contentScore: null, status: 'published' },
      select: { id: true, title: true, content: true },
      take: 10, // Process in batches
    });

    for (const post of unscored) {
      // Simple heuristic score (in production, call AI service)
      const wordCount = post.content.split(/\s+/).length;
      const hasHeadings = /<h[2-3]>/.test(post.content);
      const hasLinks = /<a href/.test(post.content);
      const hasImages = /<img/.test(post.content);

      let score = 50; // Base
      if (wordCount > 500) score += 10;
      if (wordCount > 1000) score += 10;
      if (hasHeadings) score += 10;
      if (hasLinks) score += 5;
      if (hasImages) score += 5;
      if (post.title.length > 30 && post.title.length < 70) score += 10;

      await prisma.post.update({
        where: { id: post.id },
        data: { contentScore: Math.min(score, 100) },
      });
    }
  }

  /**
   * Get top posts for a given period
   */
  async getTopPosts(period: 'day' | 'week' | 'month' = 'week', limit = 10) {
    const intervals = { day: 1, week: 7, month: 30 };
    const days = intervals[period];
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return prisma.$queryRaw<{ post_id: string; title: string; slug: string; views: bigint }[]>`
      SELECT p.id as post_id, p.title, p.slug, COUNT(pv.id)::bigint as views
      FROM posts p
      JOIN page_views pv ON pv."postId" = p.id
      WHERE pv."viewedAt" >= ${from} AND p.status = 'published'
      GROUP BY p.id, p.title, p.slug
      ORDER BY views DESC
      LIMIT ${limit}
    `;
  }

  /**
   * Get engagement trends over time
   */
  async getEngagementTrends(days = 30) {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return prisma.$queryRaw<{ date: string; views: number; comments: number; reactions: number }[]>`
      SELECT
        DATE(pv."viewedAt") as date,
        COUNT(DISTINCT pv.id)::int as views,
        COUNT(DISTINCT c.id)::int as comments,
        COUNT(DISTINCT r.id)::int as reactions
      FROM page_views pv
      LEFT JOIN comments c ON c."postId" = pv."postId" AND DATE(c."createdAt") = DATE(pv."viewedAt")
      LEFT JOIN reactions r ON r."postId" = pv."postId" AND DATE(r."createdAt") = DATE(pv."viewedAt")
      WHERE pv."viewedAt" >= ${from}
      GROUP BY DATE(pv."viewedAt")
      ORDER BY date ASC
    `;
  }
}

// Singleton
let instance: ActivityAggregator | null = null;

export function getActivityAggregator(): ActivityAggregator {
  if (!instance) instance = new ActivityAggregator();
  return instance;
}

export default ActivityAggregator;
