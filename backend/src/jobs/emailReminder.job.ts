/**
 * Email reminder job for overdue/Sent invoices.
 * Sends automated reminders at configured intervals.
 * Run daily via setInterval.
 */

import prisma from '../prisma/index.js';

interface ReminderConfig {
  daysBeforeDue: number;
  onDueDate: boolean;
  intervals: number[];
}

const DEFAULT_CONFIG: ReminderConfig = {
  daysBeforeDue: 3,
  onDueDate: true,
  intervals: [7, 15, 30],
};

// Track sent reminders per process: invoiceId -> Set of reminder types
const sentReminders: Map<string, Set<string>> = new Map();

function getReminderType(daysDiff: number): string {
  if (daysDiff > 0) return `before_due_${daysDiff}`;
  if (daysDiff === 0) return 'on_due';
  return `after_due_${Math.abs(daysDiff)}`;
}

async function sendReminderEmail(invoice: any, business: any, daysDiff: number) {
  const { sendEmail } = await import('../utils/email.js');

  const isOverdue = daysDiff <= 0;
  const overdue = Math.abs(daysDiff);

  let subject: string;
  let body: string;

  if (!isOverdue) {
    subject = `Payment Reminder: ${invoice.invoiceNumber} due in ${daysDiff} day${daysDiff !== 1 ? 's' : ''}`;
    body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #1a1a2e;">Payment Reminder</h2>
        <p>Dear ${invoice.client?.name || 'Client'},</p>
        <p>This is a friendly reminder that payment for invoice <strong>${invoice.invoiceNumber}</strong> is due in <strong>${daysDiff} day${daysDiff !== 1 ? 's' : ''}</strong>.</p>
        <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Invoice:</strong> ${invoice.invoiceNumber}</p>
          <p style="margin: 4px 0;"><strong>Amount Due:</strong> ₹${invoice.total?.toLocaleString('en-IN')}</p>
          <p style="margin: 4px 0;"><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'N/A'}</p>
        </div>
        <p>Please make the payment at your earliest convenience.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">Sent by ${business?.name || 'BillingBee'}</p>
      </div>
    `;
  } else {
    subject = overdue === 0
      ? `Invoice ${invoice.invoiceNumber} is due today`
      : `OVERDUE: ${invoice.invoiceNumber} — ${overdue} day${overdue !== 1 ? 's' : ''} past due`;
    body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #dc2626;">${overdue === 0 ? 'Payment Due Today' : 'Payment Overdue'}</h2>
        <p>Dear ${invoice.client?.name || 'Client'},</p>
        <p>Invoice <strong>${invoice.invoiceNumber}</strong> for <strong>₹${invoice.total?.toLocaleString('en-IN')}</strong> is ${overdue === 0 ? 'due today' : `overdue by ${overdue} day${overdue !== 1 ? 's' : ''}`}.</p>
        <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #dc2626;">
          <p style="margin: 4px 0;"><strong>Invoice:</strong> ${invoice.invoiceNumber}</p>
          <p style="margin: 4px 0;"><strong>Amount Due:</strong> ₹${invoice.total?.toLocaleString('en-IN')}</p>
          <p style="margin: 4px 0;"><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'N/A'}</p>
          ${overdue > 0 ? `<p style="margin: 4px 0; color: #dc2626;"><strong>Days Overdue:</strong> ${overdue}</p>` : ''}
        </div>
        <p>Please arrange payment as soon as possible.</p>
        <p style="font-size: 12px; color: #9ca3af;">If you have already made the payment, please disregard this notice.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">Sent by ${business?.name || 'BillingBee'}</p>
      </div>
    `;
  }

  if (!invoice.client?.email) return;

  await sendEmail({
    to: invoice.client.email,
    subject,
    html: body,
  });
}

export async function processEmailReminders(): Promise<{
  sent: number;
  skipped: number;
  errors: number;
}> {
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all active invoices with due dates and client emails
    const invoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['Sent', 'Overdue', 'PartiallyPaid'] },
        dueDate: { not: null },
        deletedAt: null,
      },
      include: {
        client: { select: { email: true, name: true } },
        business: { select: { name: true } },
      },
    });

    for (const invoice of invoices) {
      if (!invoice.client?.email) { skipped++; continue; }

      const dueDate = new Date(invoice.dueDate!);
      dueDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const reminderType = getReminderType(daysDiff);

      if (!sentReminders.has(invoice.id)) {
        sentReminders.set(invoice.id, new Set());
      }
      const invoiceSent = sentReminders.get(invoice.id)!;

      if (invoiceSent.has(reminderType)) { skipped++; continue; }

      let shouldSend = false;
      if (daysDiff === DEFAULT_CONFIG.daysBeforeDue) shouldSend = true;
      if (daysDiff === 0 && DEFAULT_CONFIG.onDueDate) shouldSend = true;
      if (daysDiff < 0 && DEFAULT_CONFIG.intervals.includes(Math.abs(daysDiff))) shouldSend = true;

      if (!shouldSend) { skipped++; continue; }

      try {
        await sendReminderEmail(invoice, invoice.business, daysDiff);
        invoiceSent.add(reminderType);
        sent++;
      } catch (err) {
        console.error(`[ReminderJob] Failed to send reminder for ${invoice.invoiceNumber}:`, err);
        errors++;
      }
    }

    console.log(`[ReminderJob] Sent: ${sent}, Skipped: ${skipped}, Errors: ${errors}`);
  } catch (err) {
    console.error('[ReminderJob] Error:', err);
    errors++;
  }

  return { sent, skipped, errors };
}
