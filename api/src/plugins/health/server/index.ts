'use strict';

import prisma from '../../../lib/prisma';

export default ({ strapi }) => ({
  register() {
    strapi.server.routes([
      {
        method: 'GET',
        path: '/api/health',
        handler: 'health.check',
        config: { auth: false, policies: [] },
      },
      {
        method: 'GET',
        path: '/api/health/detailed',
        handler: 'health.detailed',
        config: { auth: { scope: ['admin'] }, policies: [] },
      },
    ]);

    strapi.controller('health', () => ({
      /**
       * GET /api/health — Public health check
       * Returns 200 if API is reachable, 503 if any dependency is down
       */
      async check(ctx: any) {
        const checks: Record<string, boolean> = {
          api: true,
          database: false,
        };

        // Check PostgreSQL
        try {
          await prisma.$queryRaw`SELECT 1`;
          checks.database = true;
        } catch {
          checks.database = false;
        }

        // Check Redis via BullMJQ (if queue exists)
        try {
          const { newsletterQueue } = require('../../../services/newsletter-service');
          await newsletterQueue.client.ping();
          checks.redis = true;
        } catch {
          checks.redis = false;
        }

        // Check Meilisearch
        try {
          const { meilisearchClient } = require('../../../services/search-service');
          await meilisearchClient.health();
          checks.meilisearch = true;
        } catch {
          checks.meilisearch = false;
        }

        const allHealthy = Object.values(checks).every(Boolean);
        ctx.status = allHealthy ? 200 : 503;

        return {
          status: allHealthy ? 'healthy' : 'degraded',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          checks,
        };
      },

      /**
       * GET /api/health/detailed — Detailed health for admins
       * Includes version info, memory, connection pools
       */
      async detailed(ctx: any) {
        const basic = await this.check(ctx);

        // Memory usage
        const mem = process.memoryUsage();

        // DB connection stats
        let dbStats = {};
        try {
          const tableCounts = await prisma.$queryRaw<{ table_name: string; row_count: bigint }[]>`
            SELECT relname as table_name, n_live_tup as row_count
            FROM pg_stat_user_tables
            ORDER BY n_live_tup DESC
            LIMIT 20
          `;
          dbStats = { tables: tableCounts };
        } catch { /* skip */ }

        return {
          ...basic,
          version: process.env.npm_package_version || '1.0.0',
          node: process.version,
          memory: {
            heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
            heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + 'MB',
            rss: Math.round(mem.rss / 1024 / 1024) + 'MB',
          },
          database: dbStats,
        };
      },
    }));
  },
});
