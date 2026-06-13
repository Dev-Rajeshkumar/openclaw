'use strict';

import prisma from '../../../lib/prisma';

export default ({ strapi }) => ({
  register() {
    // Auto-logging middleware — captures all admin API mutations
    strapi.server.use(async (ctx: any, next: any) => {
      await next();

      // Only log admin mutations
      const method = ctx.request.method;
      if (!['POST', 'PUT', 'DELETE'].includes(method)) return;

      const url = ctx.request.url;
      if (!url.startsWith('/api/') || url.includes('audit-log')) return;

      const user = ctx.state.user;
      if (!user) return;

      try {
        const entityType = url.replace('/api/', '').split('/')[0];
        const entityId = ctx.params.id || ctx.response.body?.data?.id || 'batch';

        await prisma.auditLog.create({
          data: {
            action: method === 'POST' ? 'create' : method === 'PUT' ? 'update' : 'delete',
            entityType,
            entityId: String(entityId),
            oldValue: method !== 'POST' ? ctx.request.body : null,
            newValue: ctx.response.body?.data || null,
            ipAddress: ctx.request.ip || 'unknown',
            userAgent: ctx.request.headers['user-agent'] || '',
            actorId: user.id,
          },
        }).catch(() => {});
      } catch { /* silently fail */ }
    });

    strapi.server.routes([
      {
        method: 'GET',
        path: '/api/audit-logs',
        handler: 'auditLog.find',
        config: { auth: { scope: ['admin'] } },
      },
    ]);

    strapi.controller('auditLog', () => ({
      async find(ctx) {
        const { entityType, entityId, action, actorId, page = 1, pageSize = 50, from, to } = ctx.query;

        const where: any = {};
        if (entityType) where.entityType = entityType;
        if (entityId) where.entityId = entityId;
        if (action) where.action = action;
        if (actorId) where.actorId = actorId;
        if (from || to) {
          where.createdAt = {};
          if (from) where.createdAt.gte = new Date(from);
          if (to) where.createdAt.lte = new Date(to);
        }

        const [logs, total] = await Promise.all([
          prisma.auditLog.findMany({
            where,
            take: Number(pageSize),
            skip: (Number(page) - 1) * Number(pageSize),
            orderBy: { createdAt: 'desc' },
          }),
          prisma.auditLog.count({ where }),
        ]);

        return {
          data: logs,
          meta: { total, page: Number(page), pageSize: Number(pageSize) },
        };
      },
    }));

    strapi.log.info('📝 Audit Log plugin registered');
  },

  bootstrap() {
    strapi.log.info('[Audit] Auto-logging middleware active');
  },
});
