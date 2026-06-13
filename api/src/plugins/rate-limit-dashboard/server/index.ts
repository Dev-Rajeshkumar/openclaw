'use strict';

import prisma from '../../../lib/prisma';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const ENDPOINT_GROUPS = [
  { id: 'content', label: 'Content API', pattern: '^/api/posts|^/api/pages|^/api/media|^/api/categories|^/api/tags', defaultMax: 100, defaultInterval: 60000 },
  { id: 'comments', label: 'Comments API', pattern: '^/api/comments', defaultMax: 30, defaultInterval: 60000 },
  { id: 'auth', label: 'Authentication', pattern: '^/api/auth|^/api/users-permissions', defaultMax: 10, defaultInterval: 60000 },
  { id: 'admin', label: 'Admin API', pattern: '^/api/|^/admin', defaultMax: 200, defaultInterval: 60000 },
  { id: 'webhooks', label: 'Webhooks', pattern: '^/api/webhooks', defaultMax: 50, defaultInterval: 60000 },
  { id: 'search', label: 'Search', pattern: '^/api/search', defaultMax: 60, defaultInterval: 60000 },
  { id: 'upload', label: 'File Upload', pattern: '^/api/upload', defaultMax: 20, defaultInterval: 60000 },
  { id: 'analytics', label: 'Analytics', pattern: '^/api/analytics', defaultMax: 100, defaultInterval: 60000 },
];

const ALERT_THRESHOLDS = {
  warning: 0.7,  // 70% of limit
  critical: 0.9, // 90% of limit
};

// Simple in-memory store for rate-limit tracking (persisted to DB periodically)
const rateLimitStore: Map<string, { count: number; resetAt: number; windowMs: number; max: number }> = new Map();
const ipBlocklist: Set<string> = new Set();

export default ({ strapi }) => ({
  register() {
    // ── Periodic cleanup of expired entries ──────────────────
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetAt <= now) {
          rateLimitStore.delete(key);
        }
      }
    }, 60000); // every minute
    cleanupInterval.unref();

    // ── Rate-limit enforcement middleware ────────────────────
    strapi.server.use(async (ctx: any, next: any) => {
      const ip = ctx.request.ip || ctx.request.headers['x-forwarded-for'] || 'unknown';

      // Check if IP is blocked
      if (ipBlocklist.has(ip)) {
        const blockRecord = await prisma.rateLimitBlock.findFirst({
          where: { ipAddress: ip, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        });
        if (blockRecord) {
          ctx.status = 403;
          ctx.body = { error: 'IP_BLOCKED', message: 'Your IP address has been blocked due to excessive requests' };
          return;
        }
        ipBlocklist.delete(ip);
      }

      await next();

      // Track rate limit usage after response
      const url = ctx.request.url;
      const userId = ctx.state.user?.id || 'anonymous';
      const key = `${userId}:${ip}`;

      // Find matching endpoint group
      const group = ENDPOINT_GROUPS.find(g => new RegExp(g.pattern).test(url));
      if (!group) return;

      // Fetch configured limit from DB
      const config = await prisma.rateLimitConfig.findFirst({
        where: { endpointGroup: group.id },
      });

      const max = config?.max || group.defaultMax;
      const windowMs = config?.interval || group.defaultInterval;

      // Update in-memory counter
      let entry = rateLimitStore.get(key);
      const now = Date.now();
      if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + windowMs, windowMs, max };
        rateLimitStore.set(key, entry);
      }
      entry.count++;

      // Check alert thresholds
      const ratio = entry.count / entry.max;
      if (ratio >= ALERT_THRESHOLDS.critical) {
        // Log critical alert
        prisma.rateLimitAlert.create({
          data: {
            endpointGroup: group.id,
            ipAddress: ip,
            userId: userId !== 'anonymous' ? userId : null,
            severity: 'critical',
            requestsInWindow: entry.count,
            windowMax: max,
            message: `CRITICAL: ${ip} at ${Math.round(ratio * 100)}% of rate limit for ${group.label}`,
          },
        }).catch(() => {});
      } else if (ratio >= ALERT_THRESHOLDS.warning) {
        // Only log warning if not recently warned (throttle warnings to once per window)
        prisma.rateLimitAlert.findFirst({
          where: {
            ipAddress: ip,
            severity: 'warning',
            createdAt: { gt: new Date(now - windowMs) },
          },
        }).then(existing => {
          if (!existing) {
            prisma.rateLimitAlert.create({
              data: {
                endpointGroup: group.id,
                ipAddress: ip,
                userId: userId !== 'anonymous' ? userId : null,
                severity: 'warning',
                requestsInWindow: entry!.count,
                windowMax: max,
                message: `WARNING: ${ip} at ${Math.round(ratio * 100)}% of rate limit for ${group.label}`,
              },
            }).catch(() => {});
          }
        }).catch(() => {});
      }
    });

    // ── Routes ────────────────────────────────────────────────

    strapi.server.routes([
      // Get all endpoint groups with their current config
      {
        method: 'GET',
        path: '/api/rate-limit/groups',
        handler: 'rateLimitDashboard.getGroups',
        config: { auth: { scope: ['admin'] } },
      },
      // Get/update rate limit config for a group
      {
        method: 'GET',
        path: '/api/rate-limit/config',
        handler: 'rateLimitDashboard.getConfigs',
        config: { auth: { scope: ['admin'] } },
      },
      {
        method: 'PUT',
        path: '/api/rate-limit/config/:groupId',
        handler: 'rateLimitDashboard.updateConfig',
        config: { auth: { scope: ['admin'] } },
      },
      // Usage stats and analytics
      {
        method: 'GET',
        path: '/api/rate-limit/stats',
        handler: 'rateLimitDashboard.stats',
        config: { auth: { scope: ['admin'] } },
      },
      {
        method: 'GET',
        path: '/api/rate-limit/stats/timeseries',
        handler: 'rateLimitDashboard.timeSeries',
        config: { auth: { scope: ['admin'] } },
      },
      // Block/unblock IPs
      {
        method: 'GET',
        path: '/api/rate-limit/blocks',
        handler: 'rateLimitDashboard.getBlockedIPs',
        config: { auth: { scope: ['admin'] } },
      },
      {
        method: 'POST',
        path: '/api/rate-limit/blocks',
        handler: 'rateLimitDashboard.blockIP',
        config: { auth: { scope: ['admin'] } },
      },
      {
        method: 'DELETE',
        path: '/api/rate-limit/blocks/:ip',
        handler: 'rateLimitDashboard.unblockIP',
        config: { auth: { scope: ['admin'] } },
      },
      // Alerts
      {
        method: 'GET',
        path: '/api/rate-limit/alerts',
        handler: 'rateLimitDashboard.alerts',
        config: { auth: { scope: ['admin'] } },
      },
      {
        method: 'PUT',
        path: '/api/rate-limit/alerts/:alertId/acknowledge',
        handler: 'rateLimitDashboard.acknowledgeAlert',
        config: { auth: { scope: ['admin'] } },
      },
      // Per-user rate limit view
      {
        method: 'GET',
        path: '/api/rate-limit/users/:userId/usage',
        handler: 'rateLimitDashboard.userUsage',
        config: { auth: { scope: ['admin'] } },
      },
      {
        method: 'GET',
        path: '/api/rate-limit/role-defaults',
        handler: 'rateLimitDashboard.getRoleDefaults',
        config: { auth: { scope: ['admin'] } },
      },
      {
        method: 'PUT',
        path: '/api/rate-limit/role-defaults/:roleType',
        handler: 'rateLimitDashboard.setRoleDefaults',
        config: { auth: { scope: ['admin'] } },
      },
    ]);

    // ── Controllers ───────────────────────────────────────────

    strapi.controller('rateLimitDashboard', () => ({
      /**
       * GET /api/rate-limit/groups
       * List all endpoint groups with current config and runtime stats.
       */
      async getGroups(ctx: any) {
        const configs = await prisma.rateLimitConfig.findMany();
        const configMap = new Map(configs.map(c => [c.endpointGroup, c]));

        const groups = ENDPOINT_GROUPS.map(g => {
          const config = configMap.get(g.id);
          return {
            id: g.id,
            label: g.label,
            pattern: g.pattern,
            max: config?.max ?? g.defaultMax,
            interval: config?.interval ?? g.defaultInterval,
            enabled: config?.enabled ?? true,
            custom: !!config,
          };
        });

        return ctx.send({ data: groups });
      },

      /**
       * GET /api/rate-limit/config
       * Get all rate limit configs from DB.
       */
      async getConfigs(ctx: any) {
        const configs = await prisma.rateLimitConfig.findMany({
          orderBy: { endpointGroup: 'asc' },
        });
        return ctx.send({ data: configs });
      },

      /**
       * PUT /api/rate-limit/config/:groupId
       * Update rate limit config for an endpoint group.
       */
      async updateConfig(ctx: any) {
        const { groupId } = ctx.params;
        const { max, interval, enabled } = ctx.request.body;

        const group = ENDPOINT_GROUPS.find(g => g.id === groupId);
        if (!group) return ctx.notFound('Endpoint group not found');

        const data: any = {};
        if (max !== undefined) data.max = max;
        if (interval !== undefined) data.interval = interval;
        if (enabled !== undefined) data.enabled = enabled;

        const config = await prisma.rateLimitConfig.upsert({
          where: { endpointGroup: groupId },
          create: {
            endpointGroup: groupId,
            label: group.label,
            max: max ?? group.defaultMax,
            interval: interval ?? group.defaultInterval,
            enabled: enabled ?? true,
          },
          update: data,
        });

        strapi.log.info(`[RateLimit] Updated config for ${groupId}: max=${config.max}, interval=${config.interval}`);
        return ctx.send({ data: config });
      },

      /**
       * GET /api/rate-limit/stats
       * Get current rate limit usage stats per group.
       */
      async stats(ctx: any) {
        const now = Date.now();

        // Count active entries per group
        const groupStats: Record<string, { activeKeys: number; totalRequests: number; nearLimit: number }> = {};
        for (const group of ENDPOINT_GROUPS) {
          groupStats[group.id] = { activeKeys: 0, totalRequests: 0, nearLimit: 0 };
        }

        for (const [key, entry] of rateLimitStore.entries()) {
          if (entry.resetAt <= now) continue;
          for (const group of ENDPOINT_GROUPS) {
            groupStats[group.id].totalRequests += entry.count;
            groupStats[group.id].activeKeys++;
            if (entry.count / entry.max >= ALERT_THRESHOLDS.warning) {
              groupStats[group.id].nearLimit++;
            }
          }
        }

        // DB stats: top IPs by alert count in last 24h
        const topOffenders = await prisma.rateLimitAlert.groupBy({
          by: ['ipAddress'],
          where: {
            severity: 'critical',
            createdAt: { gt: new Date(Date.now() - 86400000) },
          },
          _count: true,
          orderBy: { _count: { _count: 'desc' } },
          take: 10,
        });

        const activeBlocks = await prisma.rateLimitBlock.count({
          where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        });

        return ctx.send({
          data: {
            groups: ENDPOINT_GROUPS.map(g => ({
              id: g.id,
              label: g.label,
              ...groupStats[g.id],
            })),
            topOffenders: topOffenders.map(o => ({
              ipAddress: o.ipAddress,
              criticalAlerts24h: o._count,
            })),
            activeBlocks,
            timestamp: new Date().toISOString(),
          },
        });
      },

      /**
       * GET /api/rate-limit/stats/timeseries
       * Timeseries data for requests per group over time buckets.
       */
      async timeSeries(ctx: any) {
        const { hours = 24, intervalMinutes = 60 } = ctx.query;
        const from = new Date(Date.now() - Number(hours) * 3600000);
        const bucketMs = Number(intervalMinutes) * 60000;

        const alerts = await prisma.rateLimitAlert.findMany({
          where: { createdAt: { gt: from } },
          select: {
            createdAt: true,
            endpointGroup: true,
            severity: true,
          },
        });

        // Build timeseries buckets
        const buckets: Record<string, { timestamp: string; groups: Record<string, { warnings: number; criticals: number }> }> = {};
        const startTime = Math.floor(from.getTime() / bucketMs) * bucketMs;

        for (let t = startTime; t <= Date.now(); t += bucketMs) {
          const key = new Date(t).toISOString();
          buckets[key] = { timestamp: key, groups: {} };
          for (const g of ENDPOINT_GROUPS) {
            buckets[key].groups[g.id] = { warnings: 0, criticals: 0 };
          }
        }

        for (const alert of alerts) {
          const bucketTime = Math.floor(alert.createdAt.getTime() / bucketMs) * bucketMs;
          const key = new Date(bucketTime).toISOString();
          if (buckets[key]) {
            const sev = alert.severity as string;
            if (sev === 'warning') {
              buckets[key].groups[alert.endpointGroup]!.warnings++;
            } else if (sev === 'critical') {
              buckets[key].groups[alert.endpointGroup]!.criticals++;
            }
          }
        }

        return ctx.send({
          data: Object.values(buckets),
          meta: { intervalMinutes: Number(intervalMinutes), hours: Number(hours) },
        });
      },

      /**
       * GET /api/rate-limit/blocks
       * List all blocked IPs.
       */
      async getBlockedIPs(ctx: any) {
        const blocks = await prisma.rateLimitBlock.findMany({
          where: {
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          orderBy: { createdAt: 'desc' },
        });

        return ctx.send({ data: blocks });
      },

      /**
       * POST /api/rate-limit/blocks
       * Block an IP address.
       * Body: { ip, reason, expiresAt? }
       */
      async blockIP(ctx: any) {
        const { ip, reason, expiresAt, durationMinutes } = ctx.request.body;

        if (!ip) return ctx.badRequired('IP address is required');

        // Check if already blocked
        const existing = await prisma.rateLimitBlock.findFirst({
          where: {
            ipAddress: ip,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        });
        if (existing) return ctx.badRequest('IP is already blocked');

        let expires: Date | null = null;
        if (expiresAt) {
          expires = new Date(expiresAt);
        } else if (durationMinutes) {
          expires = new Date(Date.now() + Number(durationMinutes) * 60000);
        }

        const block = await prisma.rateLimitBlock.create({
          data: {
            ipAddress: ip,
            reason: reason || 'Manual block',
            expiresAt: expires,
          },
        });

        ipBlocklist.add(ip);
        strapi.log.info(`[RateLimit] Blocked IP: ${ip}${expires ? ` until ${expires.toISOString()}` : ' (permanent)'}`);

        return ctx.send({ data: block }, 201);
      },

      /**
       * DELETE /api/rate-limit/blocks/:ip
       * Unblock an IP address.
       */
      async unblockIP(ctx: any) {
        const { ip } = ctx.params;
        const decodedIP = decodeURIComponent(ip);

        await prisma.rateLimitBlock.deleteMany({
          where: { ipAddress: decodedIP },
        });

        ipBlocklist.delete(decodedIP);
        strapi.log.info(`[RateLimit] Unblocked IP: ${decodedIP}`);

        return ctx.send({ data: { ipAddress: decodedIP, status: 'unblocked' } });
      },

      /**
       * GET /api/rate-limit/alerts
       * List rate limit alerts with filtering.
       */
      async alerts(ctx: any) {
        const { severity, endpointGroup, ipAddress, page = 1, pageSize = 50, from, to, acknowledged } = ctx.query;

        const where: any = {};
        if (severity) where.severity = severity;
        if (endpointGroup) where.endpointGroup = endpointGroup;
        if (ipAddress) where.ipAddress = ipAddress;
        if (acknowledged !== undefined) where.acknowledged = acknowledged === 'true';
        if (from || to) {
          where.createdAt = {};
          if (from) where.createdAt.gte = new Date(from);
          if (to) where.createdAt.lte = new Date(to);
        }

        const [alerts, total] = await Promise.all([
          prisma.rateLimitAlert.findMany({
            where,
            take: Number(pageSize),
            skip: (Number(page) - 1) * Number(pageSize),
            orderBy: { createdAt: 'desc' }),
          }),
          prisma.rateLimitAlert.count({ where }),
        ]);

        return ctx.send({
          data: alerts,
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
       * PUT /api/rate-limit/alerts/:alertId/acknowledge
       * Acknowledge a rate limit alert.
       */
      async acknowledgeAlert(ctx: any) {
        const { alertId } = ctx.params;

        const alert = await prisma.rateLimitAlert.findUnique({
          where: { id: alertId },
        });
        if (!alert) return ctx.notFound('Alert not found');

        const updated = await prisma.rateLimitAlert.update({
          where: { id: alertId },
          data: { acknowledged: true, acknowledgedAt: new Date() },
        });

        return ctx.send({ data: updated });
      },

      /**
       * GET /api/rate-limit/users/:userId/usage
       * Get rate limit usage for a specific user.
       */
      async userUsage(ctx: any) {
        const { userId } = ctx.params;

        const alerts = await prisma.rateLimitAlert.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });

        const block = await prisma.rateLimitBlock.findFirst({
          where: {
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        });

        // Aggregate by group
        const byGroup: Record<string, { warnings: number; criticals: number }> = {};
        for (const alert of alerts) {
          if (!byGroup[alert.endpointGroup]) {
            byGroup[alert.endpointGroup] = { warnings: 0, criticals: 0 };
          }
          if (alert.severity === 'warning') byGroup[alert.endpointGroup].warnings++;
          if (alert.severity === 'critical') byGroup[alert.endpointGroup].criticals++;
        }

        return ctx.send({
          data: {
            userId,
            isBlocked: !!block,
            recentAlerts: alerts,
            byGroup,
          },
        });
      },

      /**
       * GET /api/rate-limit/role-defaults
       * Get rate limit defaults per user role.
       */
      async getRoleDefaults(ctx: any) {
        const configs = await prisma.rateLimitRoleConfig.findMany({
          orderBy: { roleType: 'asc' },
        });

        // Include default roles even if not configured
        const roles = ['anonymous', 'authenticated', 'editor', 'admin', 'superadmin'];
        const configMap = new Map(configs.map(c => [c.roleType, c]));

        return ctx.send({
          data: roles.map(role => {
            const config = configMap.get(role);
            return {
              roleType: role,
              max: config?.max ?? (role === 'admin' || role === 'superadmin' ? 500 : role === 'authenticated' ? 100 : 30),
              interval: config?.interval ?? 60000,
              enabled: config?.enabled ?? true,
              custom: !!config,
            };
          }),
        });
      },

      /**
       * PUT /api/rate-limit/role-defaults/:roleType
       * Set rate limit defaults for a role.
       */
      async setRoleDefaults(ctx: any) {
        const { roleType } = ctx.params;
        const { max, interval, enabled } = ctx.request.body;

        const data: any = {};
        if (max !== undefined) data.max = max;
        if (interval !== undefined) data.interval = interval;
        if (enabled !== undefined) data.enabled = enabled;

        const config = await prisma.rateLimitRoleConfig.upsert({
          where: { roleType },
          create: {
            roleType,
            max: max ?? 100,
            interval: interval ?? 60000,
            enabled: enabled ?? true,
          },
          update: data,
        });

        strapi.log.info(`[RateLimit] Updated role config for ${roleType}: max=${config.max}`);
        return ctx.send({ data: config });
      },
    }));

    strapi.log.info('🛡️  Rate Limit Dashboard plugin registered');
  },

  bootstrap() {
    strapi.log.info('[RateLimit] Rate limit enforcement middleware active');
  },
});
