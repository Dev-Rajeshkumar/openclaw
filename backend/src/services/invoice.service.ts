import prisma from '../prisma/index.js';
import { AppError } from '../utils/response.js';
import { logStatusChange } from './statusLog.service.js';
import { generateInvoiceNumber } from '../utils/invoiceNumber.js';
import { InvoiceStatus, InvoiceItem, Plan } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';
import { isWithinLimit } from '../utils/planLimits.js';
import { notifyNewInvoice } from './notification.service.js';

export async function createInvoice(
  userId: string,
  businessId: string,
  data: {
    clientId?: string;
    invoiceDate?: Date;
    dueDate: Date;
    items: InvoiceItem[];
    discountAmount?: number;
    notes?: string;
    terms?: string;
    invoiceTemplateId?: string;
    templateTextOverrides?: Record<string, string>;
  }
) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check monthly invoice limit
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyInvoiceCount = await prisma.invoice.count({
    where: { userId, deletedAt: null, createdAt: { gte: startOfMonth } },
  });

  if (!isWithinLimit(user.plan as Plan, 'maxInvoicesPerMonth', monthlyInvoiceCount)) {
    throw new AppError(
      `Monthly invoice limit reached for ${user.plan} plan. Upgrade to create more.`,
      403
    );
  }

  // Get business for invoice prefix
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId, deletedAt: null },
  });

  if (!business) {
    throw new AppError('Business not found', 404);
  }

  // Calculate totals
  const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = data.items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.rate;
    const afterDiscount = itemTotal - (itemTotal * item.discount) / 100;
    return sum + (afterDiscount * item.taxRate) / 100;
  }, 0);
  const discountAmount = data.discountAmount || 0;
  const total = subtotal - discountAmount + taxAmount;

  // Generate invoice number
  const invoiceNumber = generateInvoiceNumber(
    business.invoicePrefix,
    business.nextInvoiceNo
  );

  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        userId,
        businessId,
        clientId: data.clientId,
        invoiceNumber,
        invoiceDate: data.invoiceDate || new Date(),
        dueDate: data.dueDate,
        items: data.items as any,
        subtotal,
        discountAmount,
        taxAmount: Math.round(taxAmount * 100) / 100,
        total: Math.round(total * 100) / 100,
        status: InvoiceStatus.Draft,
        notes: data.notes,
        terms: data.terms,
        invoiceTemplateId: data.invoiceTemplateId,
        templateTextOverrides: data.templateTextOverrides as any,
        publicAccessToken: uuidv4(),
        createdBy: userId,
      },
    });

    await tx.business.update({
      where: { id: businessId },
      data: { nextInvoiceNo: { increment: 1 } },
    });

    return inv;
  });

  await logStatusChange({
    entity: 'Invoice',
    entityId: invoice.id,
    action: 'CREATE',
    newValue: InvoiceStatus.Draft,
    description: `Invoice ${invoiceNumber} created`,
    changedBy: userId,
  });

  return invoice;
}

export async function getInvoices(
  userId: string,
  businessId: string,
  page: number = 1,
  limit: number = 20,
  status?: string,
  search?: string,
  startDate?: string,
  endDate?: string
) {
  const skip = (page - 1) * limit;

  const where: any = {
    userId,
    businessId,
    deletedAt: null,
  };

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
    if (startDate) where.invoiceDate.gte = new Date(startDate);
    if (endDate) where.invoiceDate.lte = new Date(endDate);
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, company: true, email: true },
        },
        _count: { select: { payments: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);

  return { invoices, total, page, limit };
}

export async function getInvoiceById(invoiceId: string, userId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId, deletedAt: null },
    include: {
      client: true,
      payments: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  return invoice;
}

export async function updateInvoice(
  invoiceId: string,
  userId: string,
  data: {
    clientId?: string;
    dueDate?: Date;
    items?: InvoiceItem[];
    discountAmount?: number;
    notes?: string;
    terms?: string;
  }
) {
  const oldInvoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId, deletedAt: null },
  });

  if (!oldInvoice) {
    throw new AppError('Invoice not found', 404);
  }

  if (oldInvoice.status === InvoiceStatus.Paid) {
    throw new AppError('Cannot update a paid invoice', 400);
  }

  let subtotal = oldInvoice.subtotal;
  let taxAmount = oldInvoice.taxAmount;
  let total = oldInvoice.total;

  if (data.items) {
    subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
    taxAmount = data.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.rate;
      const afterDiscount = itemTotal - (itemTotal * item.discount) / 100;
      return sum + (afterDiscount * item.taxRate) / 100;
    }, 0);
    const discountAmount = data.discountAmount || oldInvoice.discountAmount;
    total = subtotal - discountAmount + taxAmount;
  }

  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      ...(data.clientId !== undefined && { clientId: data.clientId }),
      ...(data.dueDate && { dueDate: data.dueDate }),
      ...(data.items && { items: data.items as any }),
      ...(data.items && { subtotal }),
      ...(data.items && { taxAmount: Math.round(taxAmount * 100) / 100 }),
      ...(data.items && { total: Math.round(total * 100) / 100 }),
      ...(data.discountAmount !== undefined && { discountAmount: data.discountAmount }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.terms !== undefined && { terms: data.terms }),
    },
  });

  await logStatusChange({
    entity: 'Invoice',
    entityId: invoiceId,
    action: 'UPDATE',
    description: `Invoice ${oldInvoice.invoiceNumber} updated`,
    changedBy: userId,
  });

  return invoice;
}

export async function updateInvoiceStatus(
  invoiceId: string,
  userId: string,
  newStatus: InvoiceStatus
) {
  const oldInvoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId, deletedAt: null },
  });

  if (!oldInvoice) {
    throw new AppError('Invoice not found', 404);
  }

  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: newStatus },
  });

  await logStatusChange({
    entity: 'Invoice',
    entityId: invoiceId,
    action: 'STATUS_CHANGE',
    oldValue: oldInvoice.status,
    newValue: newStatus,
    description: `Invoice ${oldInvoice.invoiceNumber} status: ${oldInvoice.status} → ${newStatus}`,
    changedBy: userId,
  });

  return invoice;
}

export async function deleteInvoice(invoiceId: string, userId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId, deletedAt: null },
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  if (invoice.status === InvoiceStatus.Paid) {
    throw new AppError('Cannot delete a paid invoice', 400);
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { deletedAt: new Date() },
  });

  await logStatusChange({
    entity: 'Invoice',
    entityId: invoiceId,
    action: 'DELETE',
    oldValue: invoice.status,
    newValue: 'Deleted',
    description: `Invoice ${invoice.invoiceNumber} deleted`,
    changedBy: userId,
  });

  return { message: 'Invoice deleted successfully' };
}

export async function getInvoiceStats(userId: string, businessId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalInvoices,
    monthlyInvoices,
    totalRevenue,
    monthlyRevenue,
    pendingAmount,
    overdueCount,
    paidCount,
    draftCount,
    recentInvoices,
  ] = await Promise.all([
    prisma.invoice.count({ where: { userId, businessId, deletedAt: null } }),
    prisma.invoice.count({
      where: { userId, businessId, deletedAt: null, createdAt: { gte: startOfMonth } },
    }),
    prisma.invoice.aggregate({
      where: { userId, businessId, deletedAt: null, status: 'Paid' },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: {
        userId,
        businessId,
        deletedAt: null,
        status: 'Paid',
        createdAt: { gte: startOfMonth },
      },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: {
        userId,
        businessId,
        deletedAt: null,
        status: { in: ['Sent', 'Viewed', 'PartiallyPaid'] },
      },
      _sum: { total: true },
    }),
    prisma.invoice.count({
      where: { userId, businessId, deletedAt: null, status: 'Overdue' },
    }),
    prisma.invoice.count({
      where: { userId, businessId, deletedAt: null, status: 'Paid' },
    }),
    prisma.invoice.count({
      where: { userId, businessId, deletedAt: null, status: 'Draft' },
    }),
    prisma.invoice.findMany({
      where: { userId, businessId, deletedAt: null },
      include: { client: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return {
    totalInvoices,
    monthlyInvoices,
    totalRevenue: totalRevenue._sum.total || 0,
    monthlyRevenue: monthlyRevenue._sum.total || 0,
    pendingAmount: pendingAmount._sum.total || 0,
    overdueCount,
    paidCount,
    draftCount,
    recentInvoices,
  };
}

export async function duplicateInvoice(
  invoiceId: string,
  userId: string,
  businessId: string
) {
  const original = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId, deletedAt: null },
    include: { client: true },
  });

  if (!original) {
    throw new AppError('Invoice not found', 404);
  }

  // Get next invoice number
  const business = await prisma.business.findFirst({
    where: { id: businessId, deletedAt: null },
  });

  if (!business) {
    throw new AppError('Business not found', 404);
  }

  const invoiceNumber = generateInvoiceNumber(
    business.invoicePrefix,
    business.nextInvoiceNo
  );

  const newInvoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        userId,
        businessId,
        clientId: original.clientId,
        invoiceNumber,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: original.items as any,
        subtotal: original.subtotal,
        discountAmount: original.discountAmount,
        taxAmount: original.taxAmount,
        total: original.total,
        status: InvoiceStatus.Draft,
        notes: original.notes,
        terms: original.terms,
        invoiceTemplateId: original.invoiceTemplateId,
        publicAccessToken: uuidv4(),
        createdBy: userId,
      },
    });

    await tx.business.update({
      where: { id: businessId },
      data: { nextInvoiceNo: { increment: 1 } },
    });

    return inv;
  });

  await logStatusChange({
    entity: 'Invoice',
    entityId: newInvoice.id,
    action: 'CREATE',
    newValue: InvoiceStatus.Draft,
    description: `Invoice ${invoiceNumber} duplicated from ${original.invoiceNumber}`,
    changedBy: userId,
  });

  return newInvoice;
}
