/**
 * Uptime Monitor Plugin
 * Health checks, status page, incident tracking
 */
import prisma from '../../../lib/prisma';

export default ({ strapi }) => ({
  register() {
    strapi.server.routes([
      { method: 'GET', path: '/api/status', handler: 'uptime.getStatus', config: { auth: false } },
      { method: 'GET', path: '/api/status/page', handler: 'uptime.getStatusPage', config: { auth: false } },
      { method: 'POST', path: '/api/status/incidents', handler: 'uptime.createIncident', config: { auth: { scope: ['admin'] } } },
      { method: 'GET', path: '/api/status/incidents', handler: 'uptime.getIncidents', config: { auth: true } },
      { method: 'PUT', path: '/api/status/incidents/:id/resolve', handler: 'uptime.resolveIncident', config: { auth: { scope: ['admin'] } } },
    ]);

    strapi.controller('uptime', () => ({
      async getStatus() {
        const checks: Record<string, any> = {};
        let overall = 'healthy';

        // Check PostgreSQL
        try {
          await prisma.$queryRaw`SELECT 1`;
          checks.database = { status: 'up', responseTime: 0 };
        } catch {
          checks.database = { status: 'down', error: 'Connection failed' };
          overall = 'degraded';
        }

        // Check Redis
        try {
          const redis = require('ioredis');
          const client = new redis(process.env.REDIS_URL || 'redis://localhost:6379');
          const start = Date.now();
          await client.ping();
          checks.redis = { status: 'up', responseTime: Date.now() - start };
          await client.quit();
        } catch {
          checks.redis = { status: 'down', error: 'Connection failed' };
          overall = 'degraded';
        }

        return {
          data: {
            status: overall,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            checks,
          },
        };
      },

      async getStatusPage() {
        const incidents = await prisma.uptimeIncident.findMany({
          where: { resolved: false },
          orderBy: { startedAt: 'desc' },
          take: 10,
        });

        // Calculate uptime percentages (simplified)
        const now = new Date();
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [dayIncidents, weekIncidents] = await Promise.all([
          prisma.uptimeIncident.count({ where: { startedAt: { gte: dayAgo } } }),
          prisma.uptimeIncident.count({ where: { startedAt: { gte: weekAgo } } }),
        ]);

        return {
          data: {
            status: incidents.length > 0 ? 'incident' : 'operational',
            incidents,
            uptime: {
              daily: Math.max(0, 100 - dayIncidents * 0.1),
              weekly: Math.max(0, 100 - weekIncidents * 0.05),
              monthly: 99.9,
            },
            lastUpdated: now.toISOString(),
          },
        };
      },

      async createIncident(ctx: any) {
        const { title, description, severity } = ctx.request.body;
        const incident = await prisma.uptimeIncident.create({
          data: { title, description, severity: severity || 'minor', resolved: false },
        });
        return { data: incident };
      },

      async getIncidents(ctx: any) {
        const { resolved, limit = 20 } = ctx.query;
        const where: any = {};
        if (resolved !== undefined) where.resolved = resolved === 'true';
        const incidents = await prisma.uptimeIncident.findMany({
          where,
          orderBy: { startedAt: 'desc' },
          take: Number(limit),
        });
        return { data: incidents };
      },

      async resolveIncident(ctx: any) {
        const { id } = ctx.params;
        const incident = await prisma.uptimeIncident.update({
          where: { id },
          data: { resolved: true, resolvedAt: new Date() },
        });
        return { data: incident };
      },
    }));

    strapi.log.info('📊 Uptime Monitor plugin registered');
  },
});
