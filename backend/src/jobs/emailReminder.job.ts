/**
 * Email reminder job with configurable escalation sequences.
 * Uses the ReminderSchedule model per business for flexible reminder timing.
 * Tracks sent reminders in the database for persistence across restarts.
 */

import prisma from '../prisma/index.js';

interface EscalationConfig {
  daysBeforeDue: number;
  onDueDate: boolean;
  daysAfterDue: number[];
}

const DEFAULT_ESCALATION: EscalationConfig = {
  daysBeforeDue: 3,
  onDueDate: true,
  daysAfterDue: [3, 7, 14, 30],
};

/** Get the escalation config for a business, falling back to defaults. */
async function getEscalationConfig(businessId: string): Promise<EscalationConfig> {
  const schedule = await prisma.reminderSchedule.findFirst({
    where: { businessId },
  });
  if (!schedule) return DEFAULT_ESCALATION;
  return {
    daysBeforeDue: schedule.daysBefore,
    onDueDate: schedule.onDueDate,
    daysAfterDue: (schedule.daysAfter as number[]) || DEFAULT_ESCALATION.daysAfterDue,
  };
}

/** Check if a reminder was already sent for this invoice at this escalation point. */
async function wasReminderSent(invoiceId: string, escalationKey: string): Promise<boolean> {
  const existing = await prisma.notification.findFirst({
    where: {
      link: `/dashboard/invoices/${invoiceId}`,
      type: 'Reminder',
      message: { contains: escalationKey },
    },
  });
  return !!existing;
}

/** Record that a reminder was sent. */
async function recordReminderSent(invoiceId: string, userId: string, escalationKey: string): Promise<void> {
  await prisma.notification.create({
    data: {
      userId,
      title: 'Payment Reminder Sent',
      message: `Reminder sent for invoice ${escalationKey}`,
      type: 'Reminder',
      link: `/dashboard/invoices/${invoiceId}`,
    },
  });
}

async function sendReminderEmail(
  invoice: any,
  business: any,
  daysDiff: number,
  escalationLevel: number
) {
  const { queueEmail } = await import('../services/emailQueue.service.js');

  const isPreDue = daysDiff > 0;
  const isDueToday = daysDiff === 0;
  const isOverdue = daysDiff < 0;
  const overdue = Math.abs(daysDiff);

  // Escalation tones: 0 = friendly, 1 = gentle, 2 = firm, 3+ = urgent
  const tone = escalationLevel === 0 ? 'friendly'
    : escalationLevel === 1 ? 'gentle'
    : escalationLevel === 2 ? 'firm'
    : 'urgent';

  let subject: string;
  let body: string;
  const clientName = invoice.client?.name || 'Client';
  const invoiceNumber = invoice.invoiceNumber;
  const amount = '₹' + (invoice.total || 0).toLocaleString('en-IN');
  const dueDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('en-IN')
    : 'N/A';
  const businessName = business?.name || 'BillingBee';

  if (isPreDue) {
    subject = `Payment Reminder: Invoice ${invoiceNumber} due in ${daysDiff} day${daysDiff !== 1 ? 's' : ''}`;
    body = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <h2 style="color: #1a1a2e;">Payment Reminder</h2>
      <p>Dear ${clientName},</p>
      <p>This is a friendly reminder that payment for invoice <strong>${invoiceNumber}</strong> is due in <strong>${daysDiff} day${daysDiff !== 1 ? 's' : ''}</strong>.</p>
      <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Invoice:</strong> ${invoiceNumber}</p>
        <p style="margin: 4px 0;"><strong>Amount Due:</strong> ${amount}</p>
        <p style="margin: 4px 0;"><strong>Due Date:</strong> ${dueDate}</p>
      </div>
      <p>Please make the payment at your earliest convenience.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 12px; color: #9ca3af;">Sent by ${businessName}</p>
    </div>`;
  } else if (isDueToday) {
    subject = `Invoice ${invoiceNumber} is due today`;
    body = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <h2 style="color: #d97706;">Payment Due Today</h2>
      <p>Dear ${clientName},</p>
      <p>Invoice <strong>${invoiceNumber}</strong> for <strong>${amount}</strong> is due <strong>today</strong>.</p>
      <div style="background: #fffbeb; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #d97706;">
        <p style="margin: 4px 0;"><strong>Invoice:</strong> ${invoiceNumber}</p>
        <p style="margin: 4px 0;"><strong>Amount Due:</strong> ${amount}</p>
        <p style="margin: 4px 0;"><strong>Due Date:</strong> ${dueDate}</p>
      </div>
      <p>Please arrange payment today to avoid late fees.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 12px; color: #9ca3af;">Sent by ${businessName}</p>
    </div>`;
  } else {
    // Overdue — escalating tone
    const toneColors: Record<string, string> = {
      gentle: '#d97706', firm: '#dc2626', urgent: '#991b1b',
    };
    const toneLabels: Record<string, string> = {
      gentle: 'Payment Overdue', firm: 'OVERDUE — Action Required', urgent: 'URGENT: Severely Overdue',
    };
    const color = toneColors[tone] || '#dc2626';
    const label = toneLabels[tone] || 'Payment Overdue';

    subject = `${label}: Invoice ${invoiceNumber} — ${overdue} day${overdue !== 1 ? 's' : ''} past due`;
    body = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <h2 style="color: ${color};">${label}</h2>
      <p>Dear ${clientName},</p>
      <p>Invoice <strong>${invoiceNumber}</strong> for <strong>${amount}</strong> is <strong>${overdue} day${overdue !== 1 ? 's' : ''} overdue</strong> (due date: ${dueDate}).</p>
      <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${color};">
        <p style="margin: 4px 0;"><strong>Invoice:</strong> ${invoiceNumber}</p>
        <p style="margin: 4px 0;"><strong>Amount Due:</strong> ${amount}</p>
        <p style="margin: 4px 0;"><strong>Due Date:</strong> ${dueDate}</p>
        <p style="margin: 4px 0; color: ${color};"><strong>Days Overdue:</strong> ${overdue}</p>
        <p style="margin: 4px 0; color: ${color};"><strong>Reminder #:</strong> ${escalationLevel + 1}</p>
      </div>
      ${tone === 'urgent'
        ? '<p><strong>Despite previous reminders, we have not received payment. Please arrange immediate payment to avoid further action.</strong></p>'
        : '<p>Please arrange payment as soon as possible. If there are any issues, please contact us.</p>'
      }
      <p style="font-size: 12px; color: #9ca3af;">If you have already made the payment, please disregard this notice.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 12px; color: #9ca3af;">Sent by ${businessName}</p>
    </div>`;
  }

  if (!invoice.client?.email) return;

  queueEmail(invoice.client.email, subject, body);
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

    const invoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['Sent', 'Overdue', 'PartiallyPaid'] },
        dueDate: { not: null },
        deletedAt: null,
      },
      include: {
        client: { select: { email: true, name: true } },
        business: { select: { id: true, name: true } },
      },
    });

    for (const invoice of invoices) {
      if (!invoice.client?.email) { skipped++; continue; }

      const dueDate = new Date(invoice.dueDate!);
      dueDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Get business-specific escalation config
      const config = await getEscalationConfig(invoice.business?.id || '');

      // Determine which escalation points apply
      const escalationPoints: { daysDiff: number; level: number }[] = [];

      // Pre-due reminder
      if (daysDiff === config.daysBeforeDue) {
        escalationPoints.push({ daysDiff, level: 0 });
      }
      // On due date
      if (daysDiff === 0 && config.onDueDate) {
        escalationPoints.push({ daysDiff, level: 1 });
      }
      // Post-due escalations
      if (daysDiff < 0) {
        const overdue = Math.abs(daysDiff);
        const afterDue = config.daysAfterDue.sort((a, b) => a - b);
        for (let i = 0; i < afterDue.length; i++) {
          if (overdue === afterDue[i]) {
            escalationPoints.push({ daysDiff, level: i + 2 });
          }
        }
      }

      for (const point of escalationPoints) {
        const escalationKey = `reminder:${point.level}`;

        // Check if already sent (persistent, survives restarts)
        const alreadySent = await wasReminderSent(invoice.id, escalationKey);
        if (alreadySent) { skipped++; continue; }

        try {
          await sendReminderEmail(invoice, invoice.business, point.daysDiff, point.level);
          await recordReminderSent(invoice.id, invoice.userId, escalationKey);
          sent++;
        } catch (err) {
          console.error(`[ReminderJob] Failed for ${invoice.invoiceNumber}:`, err);
          errors++;
        }
      }

      if (escalationPoints.length === 0) skipped++;
    }

    console.log(`[ReminderJob] Sent: ${sent}, Skipped: ${skipped}, Errors: ${errors}`);
  } catch (err) {
    console.error('[ReminderJob] Error:', err);
    errors++;
  }

  return { sent, skipped, errors };
}
