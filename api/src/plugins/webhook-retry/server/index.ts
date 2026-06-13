'use strict';

import prisma from '../../../lib/prisma';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const RETRY_SCHEDULE_MINUTES = [1, 5, 15, 60, 360, 1440]; // 1min, 5min, 15min, 1hr, 6hr, 24hr
const MAX_RETRIES = 7;

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function getNextRetryTime(attempt: number): Date {
  const minutes = RETRY_SCHEDULE_MINUTES[Math.min(attempt, RETRY_SCHEDULE_MINUTES.length - 1)];
  return new Date(Date.now() + minutes * 60000);
}

async function deliverWebhook(webhook: any, payload: any): Promise<{ statusCode: number; response: string; success: boolean }> {
  try {
    const axios = require('axios');
    const res = await axios.post(webhook.url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Id': webhook.id,
        'X-Webhook-Event': payload.event,
        'X-Webhook-Timestamp': payload.timestamp,
        ...(webhook.secret && { 'X-Webhook-Signature': signPayload(payload, webhook.secret) }),
      },
      timeout: 15000,
    });
    return { statusCode: res.status, response: JSON.stringify(res.data).slice(0, 2000), success: true };
  } catch (err: any) {
    return {
      statusCode: err.response?.status || 0,
      response: (err.message || 'Unknown error').slice(0, 2000),
      success: false,
    };
  }
}

function signPayload(payload: any, secret: string): string {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
}

// ═══════════════════════════════════════════════════════════════
// Background Retry Processor
// ═══════════════════════════════════════════════════════════════

let retryProcessorInterval: ReturnType<typeof setInterval> | null = null;

function startRetryProcessor(strapi: any) {
  if (retryProcessorInterval) return;

  retryProcessorInterval = setInterval(async () => {
    try {
      const dueRetries = await prisma.webhookRetry.findMany({
        where: {
          status: 'pending',
          nextRetryAt: { lte: new Date() },
        },
        include: { webhook: true },
        take: 50,
      });

      for (const retry of dueRetries) {
        if (!retry.webhook || !retry.webhook.isActive) {
          await prisma.webhookRetry.update({
            where: { id: retry.id },
            data: { status: 'cancelled', cancelledAt: new Date(), cancelReason: 'Webhook inactive or deleted' },
          });
          continue;
        }

        const result = await deliverWebhook(retry.webhook, retry.payload);

        if (result.success) {
          await prisma.webhookRetry.update({
            where: { id: retry.id },
            data: {
              status: 'delivered',
              deliveredAt: new Date(),
              lastStatusCode: result.statusCode,
              lastResponse: result.response,
              attempt: { increment: 1 },
            },
          });

          // Also update the original delivery record
          await prisma.webhookDelivery.update({
            where: { id: retry.deliveryId },
            data: { status: 'success', statusCode: result.statusCode, response: result.response },
          }).catch(() => {});

          strapi.log.info(`[WebhookRetry] Delivered retry ${retry.id} for webhook ${retry.webhookId}`);
        } else {
          const newAttempt = retry.attempt + 1;
          const isDead = newAttempt >= MAX_RETRIES;

          await prisma.webhookRetry.update({
            where: { id: retry.id },
            data: {
              status: isDead ? 'dead' : 'pending',
              attempt: newAttempt,
              lastStatusCode: result.statusCode,
              lastResponse: result.response,
              lastAttemptAt: new Date(),
              nextRetryAt: isDead ? null : getNextRetryTime(newAttempt),
              ...(isDead && { deadAt: new Date(), deadReason: `Max retries (${MAX_RETRIES}) exceeded` }),
            },
          });

          if (isDead) {
            // Move to dead letter queue
            await prisma.webhookDeadLetter.create({
              data: {
                webhookId: retry.webhookId,
                deliveryId: retry.deliveryId,
                event: retry.event,
                payload: retry.payload,
                lastStatusCode: result.statusCode,
                lastResponse: result.response,
                totalAttempts: newAttempt,
                failedAt: new Date(),
              },
            }).catch(() => {});

            strapi.log.warn(`[WebhookRetry] Webhook ${retry.webhookId} marked dead after ${newAttempt} attempts`);
          }
        }
      }
    } catch (err: any) {
      strapi.log.error('[WebhookRetry] Processor error:', err.message);
    }
  }, 30000); // Check every 30 seconds

  retryProcessorInterval.unref();
}

// ═══════════════════════════════════════════════════════════════
// Plugin Registration
// ═══════════════════════════════════════════════════════════════

export default ({ strapi }) => ({
  register() {
    // ── Routes ────────────────────────────────────────────────

    strapi.server.routes([
      // Retry queue management
      {
        method: 'GET',
        path: '/api/webhook-retry/queue',
        handler: 'webhookRetry.getQueue',
        config: { auth: { scope: ['admin'] } },
      },
      {
        method: 'GET',
        path: '/api/webhook-retry/queue/:retryId',
        handler: 'webhookRetry.getRetryDetail',
        config: { auth: { scope: ['admin'] } },
      },
      {
        method: 'POST',
        path: '/api/webhook-retry/queue/:retryId/retry',
        handler: 'webhookRetry.manualRetry',
        config: { auth: { scope: ['admin'] } },
      },
      {
        method: 'POST',
        path: '/api/webhook-retry/queue/:retryId/cancel',
        handler: 'webhookRetry.cancelRetry',
        config: { auth: { scope: ['admin'] } },
      },
      // Dead letter queue
      {
        method: 'GET',
        path: '/api/webhook-retry/dead-letters',
        handler: 'webhookRetry.getDeadLetters',
        config: { auth: { scope: ['admin'] } },
      },
      {
        method: 'POST',
        path: '/api/webhook-retry/dead-letters/:deadLetterId/retry',
        handler: 'webhookRetry.retryDeadLetter',
        config: { auth: { scope: ['admin'] } },
      },
      {
        method: 'DELETE',
        path: '/api/webhook-retry/dead-letters/:deadLetterId',
        handler: 'webhookRetry.deleteDeadLetter',
        config: { auth: { scope: ['admin'] } },
      },
      // Bulk operations
      {
        method: 'POST',
        path: '/api/webhook-retry/bulk/retry',
        handler: 'webhookRetry.bulkRetry',
        config: { auth: { scope: ['admin'] } },
      },
      {
        method: 'POST',
        path: '/api/webhook-retry/bulk/cancel',
        handler: 'webhookRetry.bulkCancel',
        config: { auth: { scope: ['admin'] } },
      },
      {
        method: 'POST',
        path: '/api/webhook-retry/bulk/clear-dead',
        handler: 'webhookRetry.bulkClearDead',
        config: { auth: { scope: ['admin'] } },
      },
      // Stats
      {
        method: 'GET',
        path: '/api/webhook-retry/stats',
        handler: 'webhookRetry.stats',
        config: { auth: { scope: ['admin'] } },
      },
      // Enqueue a failed delivery for retry (called internally)
      {
        method: 'POST',
        path: '/api/webhook-retry/enqueue',
        handler: 'webhookRetry.enqueue',
        config: { auth: { scope: ['admin'] } },
      },
    ]);

    // ── Controllers ───────────────────────────────────────────

    strapi.controller('webhookRetry', () => ({
      /**
       * GET /api/webhook-retry/queue
       * View the retry queue with filtering and pagination.
       */
      async getQueue(ctx: any) {
        const { status, webhookId, event, page = 1, pageSize = 25, sortBy = 'nextRetryAt', sortOrder = 'asc' } = ctx.query;

        const where: any = {};
        if (status) where.status = status;
        if (webhookId) where.webhookId = webhookId;
        if (event) where.event = event;

        const [items, total] = await Promise.all([
          prisma.webhookRetry.findMany({
            where,
            include: {
              webhook: { select: { id: true, name: true, url: true, isActive: true } },
            },
            take: Number(pageSize),
            skip: (Number(page) - 1) * Number(pageSize),
            orderBy: { [sortBy]: sortOrder },
          }),
          prisma.webhookRetry.count({ where }),
        ]);

        // Summary counts
        const [pending, delivered, dead, cancelled] = await Promise.all([
          prisma.webhookRetry.count({ where: { status: 'pending' } }),
          prisma.webhookRetry.count({ where: { status: 'delivered' } }),
          prisma.webhookRetry.count({ where: { status: 'dead' } }),
          prisma.webhookRetry.count({ where: { status: 'cancelled' } }),
        ]);

        return ctx.send({
          data: items,
          meta: {
            pagination: {
              page: Number(page),
              pageSize: Number(pageSize),
              total,
              pageCount: Math.ceil(total / Number(pageSize)),
            },
            summary: { pending, delivered, dead, cancelled },
          },
        });
      },

      /**
       * GET /api/webhook-retry/queue/:retryId
       * Get detailed info about a specific retry entry.
       */
      async getRetryDetail(ctx: any) {
        const { retryId } = ctx.params;

        const retry = await prisma.webhookRetry.findUnique({
          where: { id: retryId },
          include: {
            webhook: true,
          },
        });

        if (!retry) return ctx.notFound('Retry entry not found');

        return ctx.send({ data: retry });
      },

      /**
       * POST /api/webhook-retry/queue/:retryId/retry
       * Manually trigger a retry for a specific entry.
       */
      async manualRetry(ctx: any) {
        const { retryId } = ctx.params;

        const retry = await prisma.webhookRetry.findUnique({
          where: { id: retryId },
          include: { webhook: true },
        });

        if (!retry) return ctx.notFound('Retry entry not found');
        if (retry.status === 'delivered') return ctx.badRequest('Already delivered');
        if (retry.status === 'dead') return ctx.badRequest('Cannot retry dead entry — use dead letter retry instead');

        if (!retry.webhook || !retry.webhook.isActive) {
          return ctx.badRequest('Webhook is inactive or deleted');
        }

        const result = await deliverWebhook(retry.webhook, retry.payload);

        if (result.success) {
          const updated = await prisma.webhookRetry.update({
            where: { id: retryId },
            data: {
              status: 'delivered',
              deliveredAt: new Date(),
              lastStatusCode: result.statusCode,
              lastResponse: result.response,
              attempt: { increment: 1 },
            },
          });

          await prisma.webhookDelivery.update({
            where: { id: retry.deliveryId },
            data: { status: 'success', statusCode: result.statusCode, response: result.response },
          }).catch(() => {});

          return ctx.send({ data: updated, meta: { message: 'Webhook delivered successfully' } });
        } else {
          const newAttempt = retry.attempt + 1;
          const isDead = newAttempt >= MAX_RETRIES;

          const updated = await prisma.webhookRetry.update({
            where: { id: retryId },
            data: {
              status: isDead ? 'dead' : 'pending',
              attempt: newAttempt,
              lastStatusCode: result.statusCode,
              lastResponse: result.response,
              lastAttemptAt: new Date(),
              nextRetryAt: isDead ? null : getNextRetryTime(newAttempt),
              ...(isDead && { deadAt: new Date(), deadReason: `Max retries (${MAX_RETRIES}) exceeded` }),
            },
          });

          if (isDead) {
            await prisma.webhookDeadLetter.create({
              data: {
                webhookId: retry.webhookId,
                deliveryId: retry.deliveryId,
                event: retry.event,
                payload: retry.payload,
                lastStatusCode: result.statusCode,
                lastResponse: result.response,
                totalAttempts: newAttempt,
                failedAt: new Date(),
              },
            }).catch(() => {});
          }

          return ctx.send({
            data: updated,
            meta: {
              message: isDead
                ? `Max retries exceeded. Moved to dead letter queue.`
                : `Delivery failed. Scheduled for retry #${newAttempt} at ${updated.nextRetryAt?.toISOString()}`,
              statusCode: result.statusCode,
            },
          });
        }
      },

      /**
       * POST /api/webhook-retry/queue/:retryId/cancel
       * Cancel a pending retry.
       */
      async cancelRetry(ctx: any) {
        const { retryId } = ctx.params;
        const { reason } = ctx.request.body;

        const retry = await prisma.webhookRetry.findUnique({ where: { id: retryId } });
        if (!retry) return ctx.notFound('Retry entry not found');
        if (retry.status !== 'pending') return ctx.badRequest(`Cannot cancel retry with status: ${retry.status}`);

        const updated = await prisma.webhookRetry.update({
          where: { id: retryId },
          data: {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancelReason: reason || 'Manually cancelled',
          },
        });

        return ctx.send({ data: updated });
      },

      /**
       * GET /api/webhook-retry/dead-letters
       * View the dead letter queue.
       */
      async getDeadLetters(ctx: any) {
        const { webhookId, event, page = 1, pageSize = 25 } = ctx.query;

        const where: any = {};
        if (webhookId) where.webhookId = webhookId;
        if (event) where.event = event;

        const [items, total] = await Promise.all([
          prisma.webhookDeadLetter.findMany({
            where,
            include: {
              webhook: { select: { id: true, name: true, url: true } },
            },
            take: Number(pageSize),
            skip: (Number(page) - 1) * Number(pageSize),
            orderBy: { failedAt: 'desc' },
          }),
          prisma.webhookDeadLetter.count({ where }),
        ]);

        return ctx.send({
          data: items,
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
       * POST /api/webhook-retry/dead-letters/:deadLetterId/retry
       * Retry a dead letter entry (creates a new retry from attempt 0).
       */
      async retryDeadLetter(ctx: any) {
        const { deadLetterId } = ctx.params;

        const deadLetter = await prisma.webhookDeadLetter.findUnique({
          where: { id: deadLetterId },
          include: { webhook: true },
        });

        if (!deadLetter) return ctx.notFound('Dead letter entry not found');
        if (!deadLetter.webhook || !deadLetter.webhook.isActive) {
          return ctx.badRequest('Webhook is inactive or deleted');
        }

        // Create a new retry entry starting from attempt 0
        const newRetry = await prisma.webhookRetry.create({
          data: {
            webhookId: deadLetter.webhookId,
            deliveryId: deadLetter.deliveryId,
            event: deadLetter.event,
            payload: deadLetter.payload,
            status: 'pending',
            attempt: 0,
            nextRetryAt: new Date(), // immediate
          },
        });

        // Remove from dead letter queue
        await prisma.webhookDeadLetter.delete({ where: { id: deadLetterId } });

        strapi.log.info(`[WebhookRetry] Re-queued dead letter ${deadLetterId} as retry ${newRetry.id}`);

        return ctx.send({
          data: newRetry,
          meta: { message: 'Dead letter re-queued for immediate retry' },
        }, 201);
      },

      /**
       * DELETE /api/webhook-retry/dead-letters/:deadLetterId
       * Delete a dead letter entry.
       */
      async deleteDeadLetter(ctx: any) {
        const { deadLetterId } = ctx.params;

        const deadLetter = await prisma.webhookDeadLetter.findUnique({ where: { id: deadLetterId } });
        if (!deadLetter) return ctx.notFound('Dead letter entry not found');

        await prisma.webhookDeadLetter.delete({ where: { id: deadLetterId } });

        return ctx.send({ data: { id: deadLetterId, status: 'deleted' } });
      },

      /**
       * POST /api/webhook-retry/bulk/retry
       * Bulk retry all pending entries or a filtered set.
       * Body: { ids?: string[], webhookId?: string }
       */
      async bulkRetry(ctx: any) {
        const { ids, webhookId } = ctx.request.body;

        const where: any = { status: 'pending' };
        if (ids?.length) where.id = { in: ids };
        if (webhookId) where.webhookId = webhookId;

        const retries = await prisma.webhookRetry.findMany({
          where,
          include: { webhook: true },
        });

        let succeeded = 0;
        let failed = 0;
        let skipped = 0;

        for (const retry of retries) {
          if (!retry.webhook?.isActive) {
            skipped++;
            continue;
          }

          const result = await deliverWebhook(retry.webhook, retry.payload);
          if (result.success) {
            await prisma.webhookRetry.update({
              where: { id: retry.id },
              data: { status: 'delivered', deliveredAt: new Date(), lastStatusCode: result.statusCode, lastResponse: result.response, attempt: { increment: 1 } },
            });
            succeeded++;
          } else {
            const newAttempt = retry.attempt + 1;
            const isDead = newAttempt >= MAX_RETRIES;
            await prisma.webhookRetry.update({
              where: { id: retry.id },
              data: {
                status: isDead ? 'dead' : 'pending',
                attempt: newAttempt,
                lastStatusCode: result.statusCode,
                lastResponse: result.response,
                lastAttemptAt: new Date(),
                nextRetryAt: isDead ? null : getNextRetryTime(newAttempt),
                ...(isDead && { deadAt: new Date(), deadReason: `Max retries (${MAX_RETRIES}) exceeded` }),
              },
            });
            failed++;
          }
        }

        return ctx.send({
          data: { total: retries.length, succeeded, failed, skipped },
          meta: { message: `Bulk retry complete: ${succeeded} delivered, ${failed} failed, ${skipped} skipped` },
        });
      },

      /**
       * POST /api/webhook-retry/bulk/cancel
       * Bulk cancel pending retries.
       * Body: { ids?: string[], webhookId?: string }
       */
      async bulkCancel(ctx: any) {
        const { ids, webhookId } = ctx.request.body;

        const where: any = { status: 'pending' };
        if (ids?.length) where.id = { in: ids };
        if (webhookId) where.webhookId = webhookId;

        const result = await prisma.webhookRetry.updateMany({
          where,
          data: { status: 'cancelled', cancelledAt: new Date(), cancelReason: 'Bulk cancelled' },
        });

        return ctx.send({ data: { cancelled: result.count } });
      },

      /**
       * POST /api/webhook-retry/bulk/clear-dead
       * Bulk clear dead letter entries.
       * Body: { ids?: string[], webhookId?: string }
       */
      async bulkClearDead(ctx: any) {
        const { ids, webhookId } = ctx.request.body;

        const where: any = {};
        if (ids?.length) where.id = { in: ids };
        if (webhookId) where.webhookId = webhookId;

        const result = await prisma.webhookDeadLetter.deleteMany({ where });

        return ctx.send({ data: { deleted: result.count } });
      },

      /**
       * GET /api/webhook-retry/stats
       * Get retry queue statistics.
       */
      async stats(ctx: any) {
        const [
          pendingCount,
          deliveredCount,
          deadCount,
          cancelledCount,
          totalRetries,
          avgAttempts,
          recentFailures,
          webhookStats,
        ] = await Promise.all([
          prisma.webhookRetry.count({ where: { status: 'pending' } }),
          prisma.webhookRetry.count({ where: { status: 'delivered' } }),
          prisma.webhookRetry.count({ where: { status: 'dead' } }),
          prisma.webhookRetry.count({ where: { status: 'cancelled' } }),
          prisma.webhookRetry.count(),
          prisma.webhookRetry.aggregate({ _avg: { attempt: true } }),
          prisma.webhookRetry.count({
            where: { status: { in: ['dead', 'pending'] }, lastAttemptAt: { gt: new Date(Date.now() - 86400000) } },
          }),
          prisma.webhookRetry.groupBy({
            by: ['webhookId'],
            _count: true,
            _avg: { attempt: true },
            orderBy: { _count: { _count: 'desc' } },
            take: 10,
          }),
        ]);

        const topWebhooks = await Promise.all(
          webhookStats.map(async (ws: any) => {
            const webhook = await prisma.webhook.findUnique({
              where: { id: ws.webhookId },
              select: { name: true, url: true },
            });
            return {
              webhookId: ws.webhookId,
              name: webhook?.name,
              url: webhook?.url,
              retryCount: ws._count,
              avgAttempts: Math.round((ws._avg.attempt || 0) * 100) / 100,
            };
          }),
        );

        return ctx.send({
          data: {
            queue: {
              pending: pendingCount,
              delivered: deliveredCount,
              dead: deadCount,
              cancelled: cancelledCount,
              total: totalRetries,
            },
            avgAttempts: Math.round((avgAttempts._avg.attempt || 0) * 100) / 100,
            recentFailures24h: recentFailures,
            topWebhooks,
            retrySchedule: RETRY_SCHEDULE_MINUTES.map((m, i) => ({
              attempt: i + 1,
              delayMinutes: m,
              delayLabel: m < 60 ? `${m}min` : m < 1440 ? `${m / 60}hr` : `${m / 1440}day`,
            })),
            maxRetries: MAX_RETRIES,
          },
        });
      },

      /**
       * POST /api/webhook-retry/enqueue
       * Enqueue a failed delivery for retry (can be called internally or by admin).
       * Body: { deliveryId, webhookId, event, payload }
       */
      async enqueue(ctx: any) {
        const { deliveryId, webhookId, event, payload } = ctx.request.body;

        if (!webhookId || !event || !payload) {
          return ctx.badRequest('webhookId, event, and payload are required');
        }

        // Check if already enqueued
        const existing = await prisma.webhookRetry.findFirst({
          where: { deliveryId, status: 'pending' },
        });
        if (existing) {
          return ctx.badRequest('Delivery already in retry queue');
        }

        const retry = await prisma.webhookRetry.create({
          data: {
            webhookId,
            deliveryId,
            event,
            payload,
            status: 'pending',
            attempt: 0,
            nextRetryAt: getNextRetryTime(0),
          },
        });

        strapi.log.info(`[WebhookRetry] Enqueued delivery ${deliveryId} for retry (attempt 1 at ${retry.nextRetryAt?.toISOString()})`);

        return ctx.send({ data: retry }, 201);
      },
    }));

    strapi.log.info('🔄 Webhook Retry Queue plugin registered');
  },

  bootstrap() {
    startRetryProcessor(strapi);
    strapi.log.info('[WebhookRetry] Background retry processor started (30s interval)');
  },
});
