import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import { canCreateInvoice, canCreateClient } from '../utils/planLimits.js';
import { calculateInvoiceTotals } from '../utils/gst.js';
import { statusLogService } from './statusLog.service.js';
import {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  ListInvoicesQuery,
  RecordPaymentInput,
} from '../validators/invoice.validator.js';
import { SubscriptionPlan, InvoiceStatus, IInvoice } from '../types/index.js';

const prisma = new PrismaClient();

export class InvoiceService {
  /**
   * Create a new invoice
   */
  async create(userId: string, businessId: string, plan: SubscriptionPlan, input: CreateInvoiceInput) {
    // Check plan limits
    const invoiceCount = await prisma.invoice.count({ where: { businessId, deletedAt: null } });
    if (!canCreateInvoice(plan, invoiceCount)) {
      throw new AppError(`Invoice limit reached for your plan. Upgrade to create more invoices.`, 403);
    }

    // Verify client belongs to this business if provided
    if (input.clientId) {
      const client = await prisma.client.findFirst({
        where: { id: input.clientId, businessId, deletedAt: null },
      });
      if (!client) {
        throw new AppError('Client not found in this business', 404);
      }
    }

    // Generate invoice number
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new AppError('Business not found', 404);

    const invoiceNumber = input.invoiceNumber || `${business.invoicePrefix}-${String(business.nextInvoiceNo).padStart(5, '0')}`;

    // Check duplicate
    const existing = await prisma.invoice.findFirst({
      where: { businessId, invoiceNumber, deletedAt: null },
    });
    if (existing) {
      throw new AppError('Invoice number already exists', 409);
    }

    // Calculate totals
    const { subtotal, gstBreakdown, total } = calculateInvoiceTotals(
      input.items,
      input.gstRate,
      input.gstType
    );

    // Create invoice and increment counter
    const [invoice] = await prisma.$transaction([
      prisma.invoice.create({
        data: {
          userId,
          businessId,
          clientId: input.clientId || null,
          invoiceNumber,
          invoiceDate: input.invoiceDate || new Date(),
          dueDate: input.dueDate || null,
          status: InvoiceStatus.DRAFT,
          gstType: input.gstType,
          gstRate: input.gstRate,
          subtotal,
          gstAmount: gstBreakdown.totalGst,
          total,
          notes: input.notes || null,
          createdBy: userId,
          updatedBy: userId,
          items: {
            create: input.items.map((item) => ({
              description: item.description,
              hsnCode: item.hsnCode,
              quantity: item.quantity,
              rate: item.rate,
              amount: Math.round(item.quantity * item.rate * 100) / 100,
            })),
          },
        },
        include: { items: true, client: true },
      }),
      prisma.business.update({
        where: { id: businessId },
        data: { nextInvoiceNo: { increment: 1 } },
      }),
    ]);

    // Status log
    await statusLogService.log({
      entity: 'Invoice',
      entityId: invoice.id,
      action: 'CREATED',
      newValue: 'DRAFT',
      description: `Invoice ${invoiceNumber} created (₹${total})`,
      changedBy: userId,
      metadata: { total, gstAmount: gstBreakdown.totalGst, gstType: input.gstType },
    });

    return invoice;
  }

  /**
   * Get all invoices for a business (soft-delete aware)
   */
  async list(businessId: string, query: ListInvoicesQuery) {
    const { page, limit, status, search, startDate, endDate, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = { businessId, deletedAt: null };

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = startDate;
      if (endDate) where.invoiceDate.lte = endDate;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          items: { where: { deletedAt: null } },
          client: { select: { id: true, name: true, email: true, gstNumber: true } },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return { invoices, total, page, limit };
  }

  /**
   * Get a single invoice
   */
  async getById(userId: string, businessId: string, invoiceId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, businessId, deletedAt: null },
      include: {
        items: { where: { deletedAt: null } },
        client: true,
        payments: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
        statusLogs: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!invoice) throw new AppError('Invoice not found', 404);
    return invoice;
  }

  /**
   * Update an invoice
   */
  async update(userId: string, businessId: string, invoiceId: string, plan: SubscriptionPlan, input: UpdateInvoiceInput) {
    const existing = await prisma.invoice.findFirst({
      where: { id: invoiceId, businessId, deletedAt: null },
      include: { items: { where: { deletedAt: null } } },
    });
    if (!existing) throw new AppError('Invoice not found', 404);

    // Only draft invoices can have items modified
    if (existing.status !== InvoiceStatus.DRAFT && input.items) {
      throw new AppError('Only draft invoices can have items modified', 400);
    }

    // Check custom invoice number permission
    if (input.invoiceNumber && input.invoiceNumber !== existing.invoiceNumber) {
      const limits = (await import('../utils/planLimits.js')).getPlanLimits(plan);
      if (!limits.canCustomizeInvoiceNumber) {
        throw new AppError('Upgrade your plan to customize invoice numbers', 403);
      }
      const duplicate = await prisma.invoice.findFirst({
        where: { businessId, invoiceNumber: input.invoiceNumber, NOT: { id: invoiceId }, deletedAt: null },
      });
      if (duplicate) throw new AppError('Invoice number already exists', 409);
    }

    let updateData: Record<string, any> = { ...input, updatedBy: userId };

    // If items updated, recalculate and replace items
    if (input.items) {
      const gstType = input.gstType || existing.gstType;
      const gstRate = input.gstRate || existing.gstRate;
      const { subtotal, gstBreakdown, total } = calculateInvoiceTotals(input.items, gstRate, gstType);

      updateData = { ...updateData, subtotal, gstAmount: gstBreakdown.totalGst, total };

      // Soft-delete old items, create new ones
      await prisma.invoiceItem.updateMany({
        where: { invoiceId },
        data: { deletedAt: new Date() },
      });
    }

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: { items: { where: { deletedAt: null } }, client: true },
    });

    // Track status change specifically
    if (input.status && input.status !== existing.status) {
      await statusLogService.log({
        entity: 'Invoice',
        entityId: invoiceId,
        action: 'STATUS_CHANGED',
        oldValue: existing.status,
        newValue: input.status,
        description: `Invoice ${existing.invoiceNumber} status: ${existing.status} → ${input.status}`,
        changedBy: userId,
      });
    }

    // Track general updates
    const changedFields = Object.keys(input).filter(
      (k) => k !== 'items' && k !== 'status' && (input as Record<string, unknown>)[k] !== (existing as Record<string, unknown>)[k]
    );

    if (changedFields.length > 0 || input.items) {
      const fieldLabels = changedFields.join(', ');
      const itemLabel = input.items ? `items updated (${input.items.length} items)` : '';
      await statusLogService.log({
        entity: 'Invoice',
        entityId: invoiceId,
        action: 'UPDATED',
        oldValue: JSON.stringify(Object.fromEntries(
          changedFields.map((k) => [k, (existing as Record<string, unknown>)[k]])
        )),
        newValue: JSON.stringify(Object.fromEntries(
          changedFields.map((k) => [k, (input as Record<string, unknown>)[k]])
        )),
        description: `Invoice ${existing.invoiceNumber} updated: ${[fieldLabels, itemLabel].filter(Boolean).join(', ')}`,
        changedBy: userId,
        metadata: { changedFields, hasItemUpdate: !!input.items },
      });
    }

    return invoice;
  }

  /**
   * Soft delete an invoice
   */
  async softDelete(userId: string, businessId: string, invoiceId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, businessId, deletedAt: null },
    });
    if (!invoice) throw new AppError('Invoice not found', 404);

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { deletedAt: new Date() },
    });

    // Soft-delete items too
    await prisma.invoiceItem.updateMany({
      where: { invoiceId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    await statusLogService.log({
      entity: 'Invoice',
      entityId: invoiceId,
      action: 'DELETED',
      oldValue: invoice.status,
      newValue: 'DELETED',
      description: `Invoice ${invoice.invoiceNumber} deleted`,
      changedBy: userId,
    });

    return { message: 'Invoice deleted successfully' };
  }

  /**
   * Record a payment
   */
  async recordPayment(userId: string, businessId: string, invoiceId: string, input: RecordPaymentInput) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, businessId, deletedAt: null },
    });
    if (!invoice) throw new AppError('Invoice not found', 404);
    if (invoice.status === InvoiceStatus.PAID) throw new AppError('Invoice already paid', 400);
    if (invoice.status === InvoiceStatus.CANCELLED) throw new AppError('Cannot pay cancelled invoice', 400);

    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        userId,
        amount: input.amount,
        method: input.method || null,
        reference: input.reference || null,
        status: 'COMPLETED',
        notes: input.notes || null,
        paidAt: input.paidAt || new Date(),
      },
    });

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: InvoiceStatus.PAID, updatedBy: userId },
    });

    await statusLogService.log({
      entity: 'Invoice',
      entityId: invoiceId,
      action: 'PAYMENT_RECORDED',
      oldValue: invoice.status,
      newValue: 'PAID',
      description: `Payment of ₹${input.amount} recorded for invoice ${invoice.invoiceNumber}`,
      changedBy: userId,
      metadata: { amount: input.amount, method: input.method, reference: input.reference },
    });

    return payment;
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats(businessId: string) {
    const [
      totalInvoices, paidInvoices, pendingInvoices, overdueInvoices,
      revenueResult, pendingResult, recentInvoices,
    ] = await Promise.all([
      prisma.invoice.count({ where: { businessId, deletedAt: null } }),
      prisma.invoice.count({ where: { businessId, status: InvoiceStatus.PAID, deletedAt: null } }),
      prisma.invoice.count({ where: { businessId, status: { in: [InvoiceStatus.SENT, InvoiceStatus.DRAFT] }, deletedAt: null } }),
      prisma.invoice.count({ where: { businessId, status: InvoiceStatus.OVERDUE, deletedAt: null } }),
      prisma.invoice.aggregate({ where: { businessId, status: InvoiceStatus.PAID, deletedAt: null }, _sum: { total: true } }),
      prisma.invoice.aggregate({ where: { businessId, status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE] }, deletedAt: null }, _sum: { total: true } }),
      prisma.invoice.findMany({
        where: { businessId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { client: { select: { id: true, name: true } } },
      }),
    ]);

    return {
      totalInvoices, paidInvoices, pendingInvoices, overdueInvoices,
      totalRevenue: revenueResult._sum.total || 0,
      pendingAmount: pendingResult._sum.total || 0,
      recentInvoices,
    };
  }
}

export const invoiceService = new InvoiceService();
