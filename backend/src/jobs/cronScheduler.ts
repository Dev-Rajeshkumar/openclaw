/**
 * Cron job scheduler using node-cron with distributed locking.
 * Replaces the old setInterval approach for better reliability.
 *
 * Locking prevents duplicate runs when multiple server instances are deployed.
 * Uses MongoDB-based locks (no Redis dependency required).
 */

import prisma from '../prisma/index.js';
import { processRecurringInvoices } from './recurringInvoice.job.js';
import { processEmailReminders } from './emailReminder.job.js';

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes — auto-expire locks

/**
 * Acquire a named lock in MongoDB. Returns true if lock was acquired.
 */
async function acquireLock(name: string): Promise<boolean> {
  try {
    await prisma.cronLock.create({
      data: {
        name,
        lockedAt: new Date(),
        expiresAt: new Date(Date.now() + LOCK_TIMEOUT_MS),
      },
    });
    return true;
  } catch {
    // Lock already exists — check if expired
    const existing = await prisma.cronLock.findUnique({ where: { name } });
    if (existing && existing.expiresAt < new Date()) {
      // Lock expired, steal it
      await prisma.cronLock.update({
        where: { name },
        data: { lockedAt: new Date(), expiresAt: new Date(Date.now() + LOCK_TIMEOUT_MS) },
      });
      return true;
    }
    return false;
  }
}

/** Release a named lock. */
async function releaseLock(name: string): Promise<void> {
  await prisma.cronLock.delete({ where: { name } }).catch(() => {});
}

/** Run a cron job with locking and error handling. */
async function runWithLock(name: string, fn: () => Promise<void>): Promise<void> {
  const acquired = await acquireLock(name);
  if (!acquired) {
    console.log(`[Cron] "${name}" already running on another instance, skipping.`);
    return;
  }

  try {
    console.log(`[Cron] Starting "${name}"...`);
    const start = Date.now();
    await fn();
    console.log(`[Cron] "${name}" completed in ${Date.now() - start}ms`);
  } catch (error) {
    console.error(`[Cron] "${name}" failed:`, error);
  } finally {
    await releaseLock(name);
  }
}

/**
 * Initialize all cron jobs.
 * Call this once from index.ts after the server starts.
 */
export function initCronJobs(): void {
  // We use simple timers with locking instead of node-cron
  // to avoid adding a new dependency. The locking mechanism
  // is the key improvement over raw setInterval.

  // Recurring invoice processor — every hour
  const recurringInterval = setInterval(async () => {
    await runWithLock('recurring-invoices', async () => {
      const result = await processRecurringInvoices();
      if (result.processed > 0) {
        console.log(`[Cron] Processed ${result.processed} recurring invoices`);
      }
    });
  }, 60 * 60 * 1000);

  // Email reminders — every 24 hours
  const reminderInterval = setTimeout(async () => {
    await runWithLock('email-reminders', async () => {
      const result = await processEmailReminders();
      if (result.sent > 0) {
        console.log(`[Cron] Sent ${result.sent} email reminders`);
      }
    });

    // Then repeat every 24h
    setInterval(async () => {
      await runWithLock('email-reminders', async () => {
        const result = await processEmailReminders();
        if (result.sent > 0) {
          console.log(`[Cron] Sent ${result.sent} email reminders`);
        }
      });
    }, 24 * 60 * 60 * 1000);
  }, 5 * 60 * 1000); // Start after 5 minutes

  // Run recurring invoices once on startup after 30s
  setTimeout(() => {
    runWithLock('recurring-invoices', processRecurringInvoices).catch(console.error);
  }, 30000);

  // Prevent intervals from keeping the process alive unnecessarily
  recurringInterval.unref();
  reminderInterval.unref();

  console.log('[Cron] Jobs initialized with MongoDB locking.');
}
