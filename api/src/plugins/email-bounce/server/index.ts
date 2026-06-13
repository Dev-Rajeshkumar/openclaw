/**
 * Email Bounce Handler Plugin
 *
 * Handles bounce callbacks from SMTP providers:
 *   - SendGrid Event Webhook
 *   - Mailgun Routes
 *   - Amazon SES Notifications
 *   - Custom SMTP bounces
 *
 * Automatically marks subscribers as bounced and logs events.
 */

import prisma from '../../../lib/prisma';
import { autoVerify } from '../../../middlewares/webhook-verifier';

export default ({ strapi }) => ({
  register() {
    strapi.server.routes([
      // SendGrid event webhook
      {
        method: 'POST',
        path: '/api/email/webhook/sendgrid',
        handler: 'emailBounce.sendgrid',
        config: { auth: false, policies: [] },
      },
      // Mailgun bounce webhook
      {
        method: 'POST',
        path: '/api/email/webhook/mailgun',
        handler: 'emailBounce.mailgun',
        config: { auth: false, policies: [] },
      },
      // Amazon SES bounce notification
      {
        method: 'POST',
        path: '/api/email/webhook/ses',
        handler: 'emailBounce.ses',
        config: { auth: false, policies: [] },
      },
      // Manual bounce check (admin)
      {
        method: 'POST',
        path: '/api/email/check-bounces',
        handler: 'emailBounce.checkBounces',
        config: { auth: { scope: ['admin'] } },
      },
      // Bounce stats (admin)
      {
        method: 'GET',
        path: '/api/email/bounce-stats',
        handler: 'emailBounce.stats',
        config: { auth: { scope: ['admin'] } },
      },
    ]);

    strapi.controller('emailBounce', () => ({
      /**
       * POST /api/email/webhook/sendgrid
       * Handles SendGrid event webhook (batch of events)
       */
      async sendgrid(ctx: any) {
        const events = ctx.request.body || [];

        for (const event of events) {
          await this._handleBounceEvent({
            email: event.email,
            event: event.event, // bounce, dropped, spam_report, unsubscribe
            reason: event.reason || event.response,
            timestamp: new Date(event.timestamp * 1000),
            provider: 'sendgrid',
            metadata: event,
          });
        }

        return ctx.send({ processed: events.length });
      },

      /**
       * POST /api/email/webhook/mailgun
       * Handles Mailgun bounce events
       */
      async mailgun(ctx: any) {
        const { recipient, event, severity, reason, 'message-id': messageId } = ctx.request.body;

        if (['bounced', 'dropped', 'complained'].includes(event)) {
          await this._handleBounceEvent({
            email: recipient,
            event,
            reason: reason || severity,
            timestamp: new Date(),
            provider: 'mailgun',
            metadata: { messageId },
          });
        }

        return ctx.send({ status: 'ok' });
      },

      /**
       * POST /api/email/webhook/ses
       * Handles Amazon SES bounce notifications
       */
      async ses(ctx: any) {
        const body = ctx.request.body;

        // SES sends JSON or URL-encoded
        let notification: any;
        try {
          notification = typeof body === 'string' ? JSON.parse(body) : body;
        } catch {
          return ctx.badRequest('Invalid SES notification');
        }

        const bounce = notification.Bounce || notification.bounce;
        if (bounce) {
          for (const recipient of (bounce.bouncedRecipients || [])) {
            await this._handleBounceEvent({
              email: recipient.emailAddress,
              event: bounce.bounceType === 'Permanent' ? 'bounce' : 'complaint',
              reason: recipient.diagnosticCode || bounce.bounceSubType,
              timestamp: new Date(),
              provider: 'ses',
              metadata: bounce,
            });
          }
        }

        return ctx.send({ status: 'ok' });
      },

      /**
       * Internal: handle a bounce event
       */
      async _handleBounceEvent(event: {
        email: string;
        event: string;
        reason?: string;
        timestamp: Date;
        provider: string;
        metadata?: any;
      }) {
        const { email, event: eventType, reason, timestamp, provider } = event;

        // Find subscriber
        const subscriber = await prisma.subscriber.findUnique({
          where: { email },
        });

        if (!subscriber) {
          strapi.log.warn(`[EmailBounce] Unknown subscriber: ${email}`);
          return;
        }

        // Update subscriber status
        if (eventType === 'bounce' || eventType === 'dropped') {
          await prisma.subscriber.update({
            where: { id: subscriber.id },
            data: {
              status: 'bounced',
              engagementScore: 0,
            },
          });
        } else if (eventType === 'spam_report' || eventType === 'complained') {
          await prisma.subscriber.update({
            where: { id: subscriber.id },
            data: {
              status: 'unsubscribed',
              unsubscribedAt: new Date(),
            },
          });
        } else if (eventType === 'unsubscribe') {
          await prisma.subscriber.update({
            where: { id: subscriber.id },
            data: {
              status: 'unsubscribed',
              unsubscribedAt: new Date(),
            },
          });
        }

        // Log the event
        await prisma.newsletterEmailEvent.create({
          data: {
            subscriberId: subscriber.id,
            eventType,
            sentAt: timestamp,
            ipAddress: `bounce:${provider}`,
            userAgent: reason || '',
          },
        }).catch(() => {});

        // Audit log
        await prisma.auditLog.create({
          data: {
            action: 'email_bounce',
            entityType: 'subscriber',
            entityId: subscriber.id,
            newValue: { eventType, reason, provider },
          },
        }).catch(() => {});

        strapi.log.info(`[EmailBounce] ${eventType} for ${email} via ${provider}`);
      },

      /**
       * POST /api/email/check-bounces
       * Manually check and clean stale subscribers
       */
      async checkBounces(ctx: any) {
        // Mark subscribers with low engagement as at-risk
        const stale = await prisma.subscriber.findMany({
          where: {
            status: 'confirmed',
            lastOpenAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
            engagementScore: { lt: 0.1 },
          },
        });

        // Update churn risk
        for (const sub of stale) {
          await prisma.subscriber.update({
            where: { id: sub.id },
            data: { churnRisk: 0.8 },
          });
        }

        return {
          data: {
            staleSubscribers: stale.length,
            markedAtRisk: stale.length,
          },
        };
      },

      /**
       * GET /api/email/bounce-stats
       * Get bounce statistics
       */
      async stats(ctx: any) {
        const [total, bounced, unsubscribed, byProvider] = await Promise.all([
          prisma.subscriber.count(),
          prisma.subscriber.count({ where: { status: 'bounced' } }),
          prisma.subscriber.count({ where: { status: 'unsubscribed' } }),
          prisma.newsletterEmailEvent.groupBy({
            by: ['ipAddress'],
            _count: true,
            where: { eventType: 'bounce' },
            take: 10,
          }),
        ]);

        return {
          data: {
            total,
            bounced,
            unsubscribed,
            confirmed: total - bounced - unsubscribed,
            bounceRate: total > 0 ? bounced / total : 0,
            unsubscribeRate: total > 0 ? unsubscribed / total : 0,
            byProvider,
          },
        };
      },
    }));

    strapi.log.info('📧 Email Bounce Handler registered');
  },
});
