'use strict';

import prisma from '../../../lib/prisma';
import axios from 'axios';
import { z } from 'zod';

const webhookSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().max(200).optional(),
  isActive: z.boolean().default(true),
});

// Event registry
const WEBHOOK_EVENTS = [
  'post.published', 'post.updated', 'post.deleted', 'post.archived',
  'comment.created', 'comment.approved', 'comment.rejected', 'comment.reported',
  'user.registered', 'user.updated', 'user.deleted',
  'subscriber.subscribed', 'subscriber.unsubscribed',
  'newsletter.sent', 'newsletter.failed',
  'form.submitted',
];

export default ({ strapi }) => ({
  /**
   * GET /webhooks
   * List all webhooks (admin)
   */
  async find(ctx) {
    const user = ctx.state.user;
    if (!user || user.role?.type !== 'admin') return ctx.unauthorized();

    const webhooks = await prisma.webhook.findMany({
      include: {
        _count: { select: { deliveries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: webhooks };
  },

  /**
   * POST /webhooks
   * Create webhook (admin)
   */
  async create(ctx) {
    const user = ctx.state.user;
    if (!user || user.role?.type !== 'admin') return ctx.unauthorized();

    const { error, data } = webhookSchema.safeParse(ctx.request.body);
    if (error) return ctx.badRequest('Validation error');

    // Validate events
    const invalidEvents = data.events.filter(e => !WEBHOOK_EVENTS.includes(e));
    if (invalidEvents.length > 0) {
      return ctx.badRequest('Invalid events', { invalidEvents, validEvents: WEBHOOK_EVENTS });
    }

    const webhook = await prisma.webhook.create({ data });
    return ctx.created({ data: webhook });
  },

  /**
   * PUT /webhooks/:id
   * Update webhook (admin)
   */
  async update(ctx) {
    const user = ctx.state.user;
    if (!user || user.role?.type !== 'admin') return ctx.unauthorized();

    const { id } = ctx.params;
    const { error, data } = webhookSchema.partial().safeParse(ctx.request.body);
    if (error) return ctx.badRequest('Validation error');

    const webhook = await prisma.webhook.update({ where: { id }, data });
    return { data: webhook };
  },

  /**
   * DELETE /webhooks/:id
   * Delete webhook (admin)
   */
  async delete(ctx) {
    const user = ctx.state.user;
    if (!user || user.role?.type !== 'admin') return ctx.unauthorized();

    const { id } = ctx.params;
    await prisma.webhook.delete({ where: { id } });
    return ctx.noContent();
  },

  /**
   * POST /webhooks/:id/test
   * Send test webhook (admin)
   */
  async test(ctx) {
    const user = ctx.state.user;
    if (!user || user.role?.type !== 'admin') return ctx.unauthorized();

    const { id } = ctx.params;

    const webhook = await prisma.webhook.findUnique({ where: { id } });
    if (!webhook) return ctx.notFound('Webhook not found');

    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: { message: 'This is a test webhook delivery' },
    };

    return this._deliver(webhook, testPayload);
  },

  /**
   * GET /webhooks/events
   * List available webhook events (admin)
   */
  async events(ctx) {
    const user = ctx.state.user;
    if (!user || user.role?.type !== 'admin') return ctx.unauthorized();

    return { data: WEBHOOK_EVENTS };
  },

  /**
   * GET /webhooks/:id/deliveries
   * Get webhook delivery history (admin)
   */
  async deliveries(ctx) {
    const user = ctx.state.user;
    if (!user || user.role?.type !== 'admin') return ctx.unauthorized();

    const { id } = ctx.params;
    const { page = 1, pageSize = 20 } = ctx.query;

    const [deliveries, total] = await Promise.all([
      prisma.webhookDelivery.findMany({
        where: { webhookId: id },
        take: Number(pageSize),
        skip: (Number(page) - 1) * Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.webhookDelivery.count({ where: { webhookId: id } }),
    ]);

    return {
      data: deliveries,
      meta: { total, page: Number(page), pageSize: Number(pageSize) },
    };
  },

  // ── Trigger webhooks (called internally by other services) ──

  /**
   * Trigger an event to all matching webhooks
   */
  async triggerEvent(event: string, payload: any) {
    const webhooks = await prisma.webhook.findMany({
      where: { isActive: true, events: { has: event } },
    });

    for (const webhook of webhooks) {
      this._deliver(webhook, { event, timestamp: new Date().toISOString(), data: payload }).catch(() => {});
    }
  },

  /**
   * Deliver a webhook payload
   */
  async _deliver(webhook: any, payload: any) {
    let statusCode: number | undefined;
    let response: string | undefined;
    let status: 'success' | 'failed' = 'success';

    try {
      const res = await axios.post(webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Id': webhook.id,
          'X-Webhook-Event': payload.event,
          'X-Webhook-Timestamp': payload.timestamp,
          ...(webhook.secret && { 'X-Webhook-Signature': this._signPayload(payload, webhook.secret) }),
        },
        timeout: 15000,
      });
      statusCode = res.status;
      response = JSON.stringify(res.data).slice(0, 2000);
    } catch (err: any) {
      status = 'failed';
      statusCode = err.response?.status;
      response = err.message?.slice(0, 2000);
    }

    // Record delivery
    await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event: payload.event,
        payload,
        status,
        statusCode,
        response,
        attempt: 1,
      },
    }).catch(() => {});

    // Retry on failure
    if (status === 'failed' && webhook.isActive) {
      setTimeout(() => this._retry(webhook, payload, 1), 5000);
    }

    return { status, statusCode };
  },

  async _retry(webhook: any, payload: any, attempt: number) {
    if (attempt > 3) return;

    try {
      await axios.post(webhook.url, payload, {
        headers: { 'Content-Type': 'application/json', 'X-Webhook-Retry': String(attempt) },
        timeout: 15000,
      });
    } catch {
      setTimeout(() => this._retry(webhook, payload, attempt + 1), 5000 * attempt);
    }
  },

  _signPayload(payload: any, secret: string): string {
    // Simple HMAC-like signature (in production use crypto.createHmac)
    const crypto = require('crypto');
    return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
  },
});
