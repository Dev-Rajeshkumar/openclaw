import prisma from '../prisma/index.js';
import { calculateNextRun, getDueRecurringInvoices } from '../services/recurringInvoice.service.js';
import { logStatusChange } from '../services/statusLog.service.js';
import { generateInvoiceNumber } from '../utils/invoiceNumber.js';
import { InvoiceStatus } from '../types/index.js';

/**
 * Process all due recurring invoices.
 * Creates new invoices from templates and updates nextRun date.
 * Should be called by a cron job (e.g., every hour).
 */
export async function processRecurringInvoices(): Promise<{
  processed: number;
  errors: number;
}> {
  const dueRecurrings = await getDueRecurringInvoices();
  let processed = 0;
  let errors = 0;

  for (const recurring of dueRecurrings) {
    try {
      await prisma.$transaction(async (tx) => {
        // Get business for invoice numbering
        const business = await tx.business.findFirst({
          where: { id: recurring.businessId, deletedAt: null },
        });

        if (!business) {
          throw new Error(`Business not found: ${recurring.businessId}`);
        }

        // Generate invoice number
        const invoiceNumber = generateInvoiceNumber(
          business.invoicePrefix,
          business.nextInvoiceNo
        );

        // Calculate totals from template items
        const items = (recurring.template as any)?.items || [];
        const subtotal = items.reduce(
          (sum: number, item: any) => sum + item.amount,
          0
        );
        const taxAmount = items.reduce((sum: number, item: any) => {
          const itemTotal = (item.quantity || 0) * (item.rate || 0);
          const afterDiscount = itemTotal - (itemTotal * (item.discount || 0)) / 100;
          return sum + (afterDiscount * (item.taxRate || 0)) / 100;
        }, 0);
        const discountAmount = (recurring.template as any)?.discountAmount || 0;
        const total = Math.round((subtotal - discountAmount + taxAmount) * 100) / 100;

        // Create the invoice
        await tx.invoice.create({
          data: {
            userId: recurring.userId,
            businessId: recurring.businessId,
            clientId: recurring.clientId,
            recurringId: recurring.id,
            invoiceNumber,
            invoiceDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            items: items,
            subtotal,
            discountAmount,
            taxAmount: Math.round(taxAmount * 100) / 100,
            total,
            status: InvoiceStatus.Draft,
            createdBy: recurring.userId,
          },
        });

        // Increment business invoice number
        await tx.business.update({
          where: { id: recurring.businessId },
          data: { nextInvoiceNo: { increment: 1 } },
        });

        // Update nextRun date
        const nextRun = calculateNextRun(new Date(), recurring.frequency);
        await tx.recurringInvoice.update({
          where: { id: recurring.id },
          data: { nextRun },
        });
      });

      // Log status change (outside transaction to avoid long locks)
      await logStatusChange({
        entity: 'RecurringInvoice',
        entityId: recurring.id,
        action: 'CREATE',
        description: `Recurring invoice ${recurring.frequency} processed successfully`,
        changedBy: recurring.userId,
      });

      processed++;
    } catch (error) {
      console.error(`[RecurringJob] Failed to process recurring ${recurring.id}:`, error);
      errors++;
    }
  }

  console.log(`[RecurringJob] Processed: ${processed}, Errors: ${errors}`);
  return { processed, errors };
}
