import { PrismaClient } from '@prisma/client';
import { omit } from 'lodash';
import { AppError } from '../middleware/errorHandler.js';
import { canCreateInvoice } from '../utils/planLimits.js';
import { generateInvoiceNumber } from '../utils/invoiceNumber.js';
import { calculateInvoiceTotals } from '../utils/gst.js';
import {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  ListInvoicesQuery,
  RecordPaymentInput,
} from '../validators/invoice.validator.js';
import { SubscriptionPlan, InvoiceStatus, IInvoiceItem } from '../types/index.js';

const prisma = new PrismaClient();

export class InvoiceService {
  /**
   * Create a new invoice
   */
  async create(userId: string, plan: SubscriptionPlan, input: CreateInvoiceInput) {
    // Check plan limits
    const invoiceCount = await prisma.invoice.count({ where: { userId } });
    if (!canCreateInvoice(plan, invoiceCount)) {
      throw new AppError(
        `Invoice limit reached for your plan. Upgrade to create more invoices.`,
        403
      );
    }

    // Verify client belongs to user if provided
    if (input.clientId) {
      const client = await prisma.client.findFirst({
        where: { id: input.clientId, userId },
      });
      if (!client) {
        throw new AppError('Client not found', 404);
      }
    }

    // Generate invoice number if not provided
    const invoiceNumber = input.invoiceNumber || (await generateInvoiceNumber(userId));

    // Check duplicate invoice number
    const existing = await prisma.invoice.findFirst({
      where: { userId, invoiceNumber },
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

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        userId,
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
      include: {
        items: true,
        client: true,
      },
    });

    return invoice;
  }

  /**
   * Get all invoices for a user with pagination and filters
   */
  async list(userId: string, query: ListInvoicesQuery) {
    const { page, limit, status, search, startDate, endDate, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) (where.invoiceDate as Record<string, Date>).gte = startDate;
      if (endDate) (where.invoiceDate as Record<string, Date>).lte = endDate;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          items: true,
          client: {
            select: { id: true, name: true, email: true, gstNumber: true },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return { invoices, total, page, limit };
  }

  /**
   * Get a single invoice by ID
   */
  async getById(userId: string, invoiceId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
      include: {
        items: true,
        client: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    return invoice;
  }

  /**
   * Update an invoice
   */
  async update(
    userId: string,
    invoiceId: string,
    plan: SubscriptionPlan,
    input: UpdateInvoiceInput
  ) {
    // Verify ownership
    const existing = await this.getById(userId, invoiceId);

    // Only draft invoices can be fully edited
    if (existing.status !== InvoiceStatus.DRAFT && input.items) {
      throw new AppError('Only draft invoices can have items modified', 400);
    }

    // Check custom invoice number permission
    if (input.invoiceNumber && input.invoiceNumber !== existing.invoiceNumber) {
      const limits = await this.getPlanLimits(plan);
      if (!limits.canCustomizeInvoiceNumber) {
        throw new AppError('Upgrade your plan to customize invoice numbers', 403);
      }

      // Check duplicate
      const duplicate = await prisma.invoice.findFirst({
        where: { userId, invoiceNumber: input.invoiceNumber, NOT: { id: invoiceId } },
      });
      if (duplicate) {
        throw new AppError('Invoice number already exists', 409);
      }
    }

    // If items are being updated, recalculate totals
    let updateData: Record<string, unknown> = omit(input, ['id']);

    if (input.items) {
      const gstType = (input.gstType || existing.gstType) as string;
      const gstRate = input.gstRate || existing.gstRate;
      const { subtotal, gstBreakdown, total } = calculateInvoiceTotals(
        input.items,
        gstRate,
        gstType
      );

      updateData = {
        ...updateData,
        subtotal,
        gstAmount: gstBreakdown.totalGst,
        total,
      };

      // Delete old items and create new ones
      await prisma.invoiceItem.deleteMany({ where: { invoiceId } });
    }

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        items: true,
        client: true,
      },
    });

    return invoice;
  }

  /**
   * Delete an invoice
   */
  async delete(userId: string, invoiceId: string) {
    await this.getById(userId, invoiceId);

    await prisma.invoiceItem.deleteMany({ where: { invoiceId } });
    await prisma.invoice.delete({ where: { id: invoiceId } });

    return { message: 'Invoice deleted successfully' };
  }

  /**
   * Record a payment for an invoice
   */
  async recordPayment(
    userId: string,
    invoiceId: string,
    input: RecordPaymentInput
  ) {
    const invoice = await this.getById(userId, invoiceId);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new AppError('Invoice is already marked as paid', 400);
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new AppError('Cannot record payment for a cancelled invoice', 400);
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        userId,
        amount: input.amount,
        method: input.method || null,
        reference: input.reference || null,
        status: 'COMPLETED' as const,
        notes: input.notes || null,
        paidAt: input.paidAt || new Date(),
      },
    });

    // Update invoice status to paid
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: InvoiceStatus.PAID },
    });

    return payment;
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(userId: string) {
    const [
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      revenueResult,
      pendingResult,
      recentInvoices,
    ] = await Promise.all([
      prisma.invoice.count({ where: { userId } }),
      prisma.invoice.count({ where: { userId, status: InvoiceStatus.PAID } }),
      prisma.invoice.count({
        where: { userId, status: { in: [InvoiceStatus.SENT, InvoiceStatus.DRAFT] } },
      }),
      prisma.invoice.count({ where: { userId, status: InvoiceStatus.OVERDUE } }),
      prisma.invoice.aggregate({
        where: { userId, status: InvoiceStatus.PAID },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { userId, status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE] } },
        _sum: { total: true },
      }),
      prisma.invoice.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          client: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalRevenue: revenueResult._sum.total || 0,
      pendingAmount: pendingResult._sum.total || 0,
      recentInvoices,
    };
  }

  private async getPlanLimits(plan: SubscriptionPlan) {
    const { getPlanLimits } = await import('../utils/planLimits.js');
    return getPlanLimits(plan);
  }
}

export const invoiceService = new InvoiceService();
