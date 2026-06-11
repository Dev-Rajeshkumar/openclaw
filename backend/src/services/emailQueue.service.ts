/**
 * Asynchronous email queue service.
 * Emails are queued and sent in the background without blocking API requests.
 * Uses a simple in-memory queue with retry logic.
 * For production with multiple instances, replace with BullMQ + Redis.
 */

import { sendEmail as sendEmailDirect } from '../utils/email.js';

interface QueuedEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
}

const queue: QueuedEmail[] = [];
let processing = false;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;
const BATCH_SIZE = 5;

/** Add an email to the queue. Returns immediately. */
export function queueEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): string {
  const id = `email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  queue.push({ id, to, subject, html, text, attempts: 0, maxAttempts: MAX_ATTEMPTS });

  // Trigger processing (non-blocking)
  processQueue().catch((err) => {
    console.error('[EmailQueue] Processing error:', err);
  });

  console.log(`[EmailQueue] Queued email to ${to} (queue length: ${queue.length})`);
  return id;
}

/** Process the email queue in the background. */
async function processQueue(): Promise<void> {
  if (processing) return;
  processing = true;

  try {
    while (queue.length > 0) {
      // Take a batch
      const batch = queue.splice(0, BATCH_SIZE);

      await Promise.allSettled(
        batch.map(async (email) => {
          try {
            email.attempts++;
            const sent = await sendEmailDirect({
              to: email.to,
              subject: email.subject,
              html: email.html,
              text: email.text,
            });

            if (sent) {
              console.log(`[EmailQueue] Sent to ${email.to} (attempt ${email.attempts})`);
            } else {
              throw new Error('sendEmail returned false');
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            email.lastError = errorMsg;

            if (email.attempts < email.maxAttempts) {
              // Re-queue with delay
              console.warn(`[EmailQueue] Failed to send to ${email.to} (attempt ${email.attempts}/${email.maxAttempts}), retrying...`);
              setTimeout(() => {
                queue.push(email);
              }, RETRY_DELAY_MS * email.attempts);
            } else {
              console.error(`[EmailQueue] Permanently failed to send to ${email.to} after ${email.maxAttempts} attempts: ${errorMsg}`);
            }
          }
        })
      );
    }
  } finally {
    processing = false;
  }
}

/** Get current queue status (for monitoring). */
export function getQueueStatus(): { pending: number; processing: boolean } {
  return { pending: queue.length, processing };
}
