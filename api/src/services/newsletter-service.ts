/**
 * Newsletter Service
 * 
 * Handles subscription management, email template rendering,
 * sending via BullMQ workers, and analytics tracking.
 * 
 * Flow:
 *   1. Admin creates newsletter in Strapi admin
 *   2. On "Send" → job queued in BullMQ
 *   3. Worker renders templates + sends via SMTP/SendGrid
 *   4. Track delivery/open/click events
 */

import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import mjml2html from 'mjml';
import sanitizeHtml from 'sanitize-html';

// --- Configuration ---
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.sendgrid.net';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USERNAME || 'apikey';
const SMTP_PASS = process.env.SMTP_PASSWORD || '';
const FROM_EMAIL = process.env.DEFAULT_FROM_EMAIL || 'noreply@cms.local';

// --- Redis & Queue ---
const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

export const newsletterQueue = new Queue('newsletter', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

// --- Email Transporter ---
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

// --- Types ---
interface NewsletterJob {
  newsletterId: number;
  subject: string;
  mjmlTemplate: string;
  segment: SubscriberSegment;
  testEmail?: string;
}

interface SubscriberSegment {
  tags?: string[];
  roles?: string[];
  locale?: string;
  allActive?: boolean;
}

interface Subscriber {
  id: number;
  email: string;
  name: string;
  locale: string;
  tags: string[];
  role: string;
  subscribedAt: string;
  preferences: {
    newsletter: boolean;
    comments: boolean;
  };
}

interface SendResult {
  subscriberId: number;
  email: string;
  status: 'sent' | 'failed' | 'bounced';
  error?: string;
  sentAt: string;
}

// --- Template Rendering ---
function renderEmailTemplate(mjmlTemplate: string, data: Record<string, unknown>): string {
  // Compile Handlebars inside MJML
  const compiled = Handlebars.compile(mjmlTemplate);
  const mjmlWithData = compiled(data);
  
  // Convert MJML to responsive HTML
  const { html, errors } = mjml2html(mjmlWithData);
  if (errors.length > 0) {
    console.warn('MJML warnings:', errors.map(e => e.message));
  }
  
  // Sanitize output
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'table', 'tr', 'td', 'th']),
    allowedAttributes: { '*': ['class', 'style'], a: ['href', 'title'], img: ['src', 'alt', 'width', 'height'] },
  });
}

// --- Subscriber Query (Strapi query engine) ---
async function getSubscribers(segment: SubscriberSegment): Promise<Subscriber[]> {
  const strapi = (global as any).strapi;
  if (!strapi) throw new Error('Strapi instance not available');

  const filters: any = { 
    confirmed: true,
    'preferences.newsletter': true,
  };

  if (segment.tags?.length) {
    filters.tags = { $in: segment.tags };
  }
  if (segment.roles?.length) {
    filters.role = { $in: segment.roles };
  }
  if (segment.locale) {
    filters.locale = segment.locale;
  }

  return strapi.entityService.findMany('plugin::users-permissions.user', {
    filters,
    fields: ['id', 'email', 'username', 'locale'],
    populate: ['tags', 'preferences'],
  });
}

// --- Queue a Newsletter Send ---
export async function queueNewsletterSend(newsletterId: number): Promise<Job> {
  const strapi = (global as any).strapi;
  
  const newsletter = await strapi.entityService.findOne(
    'api::newsletter.newsletter',
    newsletterId,
    { populate: ['segment'] }
  );

  if (!newsletter) throw new Error(`Newsletter ${newsletterId} not found`);

  const job: NewsletterJob = {
    newsletterId,
    subject: newsletter.subject,
    mjmlTemplate: newsletter.body,
    segment: newsletter.segment || { allActive: true },
  };

  return newsletterQueue.add('send-newsletter', job, {
    priority: newsletter.priority || 5,
  });
}

// --- BullMQ Worker: Process Newsletter Sends ---
export function startNewsletterWorker(): Worker {
  const worker = new Worker<NewsletterJob>('newsletter', async (job) => {
    const { subject, mjmlTemplate, segment, testEmail } = job.data;
    
    const subscribers = testEmail
      ? [{ id: 0, email: testEmail, name: 'Test', locale: 'en', tags: [], role: 'admin', subscribedAt: new Date().toISOString(), preferences: { newsletter: true, comments: true } }]
      : await getSubscribers(segment);

    console.log(`[Newsletter] Sending to ${subscribers.length} subscribers`);

    const results: SendResult[] = [];
    const BATCH_SIZE = 50; // SendGrid rate limit: 100/sec
    const DELAY_MS = 1100; // Stay under rate limit

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (sub) => {
          const html = renderEmailTemplate(mjmlTemplate, {
            name: sub.name || sub.email,
            email: sub.email,
            unsubscribeUrl: `${process.env.FRONTEND_URL}/newsletter/unsubscribe?token=${generateUnsubscribeToken(sub.id)}`,
            trackingPixel: `${process.env.API_URL}/api/newsletter/track/open?n=${job.data.newsletterId}&s=${sub.id}`,
          });

          await transporter.sendMail({
            from: `"CMS Newsletter" <${FROM_EMAIL}>`,
            to: sub.email,
            subject,
            html,
            headers: {
              'X-Newsletter-Id': String(job.data.newsletterId),
              'List-Unsubscribe': `<${process.env.FRONTEND_URL}/newsletter/unsubscribe>`,
            },
          });

          return { subscriberId: sub.id, email: sub.email, status: 'sent' as const, sentAt: new Date().toISOString() };
        })
      );

      results.push(...batchResults.map(r => 
        r.status === 'fulfilled' ? r.value : { subscriberId: 0, email: '', status: 'failed' as const, error: String(r.reason), sentAt: new Date().toISOString() }
      ));

      // Rate limit delay between batches
      if (i + BATCH_SIZE < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }

    // Update analytics in Strapi
    const strapi = (global as any).strapi;
    if (strapi) {
      await strapi.entityService.create('api::newsletter-log.newsletter-log', {
        data: {
          newsletter: job.data.newsletterId,
          sentAt: new Date().toISOString(),
          totalSubscribers: subscribers.length,
          sentCount: results.filter(r => r.status === 'sent').length,
          failedCount: results.filter(r => r.status === 'failed').length,
          results,
        },
      });
    }

    return { total: subscribers.length, sent: results.filter(r => r.status === 'sent').length };
  }, { connection, concurrency: 2 });

  worker.on('completed', (job, result) => {
    console.log(`[Newsletter] Job ${job.id} completed: ${result.sent}/${result.total} sent`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Newsletter] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

// --- Helpers ---
function generateUnsubscribeToken(subscriberId: number): string {
  // In production: use JWT or signed token
  return Buffer.from(`${subscriberId}:${Date.now()}`).toString('base64url');
}

export { renderEmailTemplate, transporter };
