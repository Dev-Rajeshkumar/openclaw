import prisma from '../prisma/index.js';
import { AppError } from '../utils/response.js';
import { logStatusChange } from './statusLog.service.js';
import { generateEstimateNumber } from '../utils/invoiceNumber.js';
import { EstimateStatus, InvoiceItem } from '../types/index.js';

export async function createEstimate(
  userId: string,
  businessId: string,
  clientId: string,
  data: {
    title: string;
    items: InvoiceItem[];
    taxAmount?: number;
    expiryDate?: Date;
    notes?: string;
    terms?: string;
  }
) {
  const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = data.taxAmount || 0;
  const total = subtotal + taxAmount;

  // Get next estimate number
  const lastEstimate = await prisma.estimate.findFirst({
    where: { userId, businessId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  const sequence = lastEstimate
    ? parseInt(lastEstimate.estimateNumber.replace('EST-', ''), 10) + 1
    : 1;
  const estimateNumber = generateEstimateNumber(sequence);

  const estimate = await prisma.estimate.create({
    data: {
      userId,
      businessId,
      clientId,
      estimateNumber,
      title: data.title,
      items: data.items as any,
      subtotal,
      taxAmount,
      total,
      status: EstimateStatus.Draft,
      expiryDate: data.expiryDate,
      notes: data.notes,
      terms: data.terms,
    },
  });

  await logStatusChange({
    entity: 'Estimate',
    entityId: estimate.id,
    action: 'CREATE',
    newValue: EstimateStatus.Draft,
    description: `Estimate ${estimateNumber} created`,
    changedBy: userId,
  });

  return estimate;
}

export async function getEstimates(
  userId: string,
  businessId: string,
  page: number = 1,
  limit: number = 20,
  status?: string,
  clientId?: string
) {
  const skip = (page - 1) * limit;

  const where: any = {
    userId,
    businessId,
    deletedAt: null,
  };

  if (status) where.status = status;
  if (clientId) where.clientId = clientId;

  const [estimates, total] = await Promise.all([
    prisma.estimate.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, company: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.estimate.count({ where }),
  ]);

  return { estimates, total, page, limit };
}

export async function getEstimateById(estimateId: string, userId: string) {
  const estimate = await prisma.estimate.findFirst({
    where: { id: estimateId, userId, deletedAt: null },
    include: { client: true },
  });

  if (!estimate) {
    throw new AppError('Estimate not found', 404);
  }

  return estimate;
}

export async function updateEstimate(
  estimateId: string,
  userId: string,
  data: {
    title?: string;
    items?: InvoiceItem[];
    taxAmount?: number;
    expiryDate?: Date;
    notes?: string;
    terms?: string;
  }
) {
  const oldEstimate = await prisma.estimate.findFirst({
    where: { id: estimateId, userId, deletedAt: null },
  });

  if (!oldEstimate) {
    throw new AppError('Estimate not found', 404);
  }

  let subtotal = oldEstimate.subtotal;
  let taxAmount = oldEstimate.taxAmount;
  let total = oldEstimate.total;

  if (data.items) {
    subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
    taxAmount = data.taxAmount || 0;
    total = subtotal + taxAmount;
  }

  const estimate = await prisma.estimate.update({
    where: { id: estimateId },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.items && { items: data.items as any }),
      ...(data.items && { subtotal }),
      ...(data.items && { taxAmount }),
      ...(data.items && { total }),
      ...(data.expiryDate !== undefined && { expiryDate: data.expiryDate }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.terms !== undefined && { terms: data.terms }),
    },
  });

  await logStatusChange({
    entity: 'Estimate',
    entityId: estimateId,
    action: 'UPDATE',
    description: `Estimate ${oldEstimate.estimateNumber} updated`,
    changedBy: userId,
  });

  return estimate;
}

export async function updateEstimateStatus(
  estimateId: string,
  userId: string,
  newStatus: EstimateStatus
) {
  const oldEstimate = await prisma.estimate.findFirst({
    where: { id: estimateId, userId, deletedAt: null },
  });

  if (!oldEstimate) {
    throw new AppError('Estimate not found', 404);
  }

  const estimate = await prisma.estimate.update({
    where: { id: estimateId },
    data: { status: newStatus },
  });

  await logStatusChange({
    entity: 'Estimate',
    entityId: estimateId,
    action: 'STATUS_CHANGE',
    oldValue: oldEstimate.status,
    newValue: newStatus,
    description: `Estimate ${oldEstimate.estimateNumber} status: ${oldEstimate.status} → ${newStatus}`,
    changedBy: userId,
  });

  return estimate;
}

export async function convertToInvoice(
  estimateId: string,
  userId: string,
  businessId: string
) {
  const estimate = await prisma.estimate.findFirst({
    where: { id: estimateId, userId, deletedAt: null },
  });

  if (!estimate) {
    throw new AppError('Estimate not found', 404);
  }

  if (estimate.status !== EstimateStatus.Accepted && estimate.status !== EstimateStatus.Sent) {
    throw new AppError('Only sent or accepted estimates can be converted to invoices', 400);
  }

  // Get business for invoice prefix
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId, deletedAt: null },
  });

  if (!business) {
    throw new AppError('Business not found', 404);
  }

  const invoiceNumber = generateInvoiceNumber(
    business.invoicePrefix,
    business.nextInvoiceNo
  );

  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        userId,
        businessId,
        clientId: estimate.clientId,
        invoiceNumber,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        items: estimate.items,
        subtotal: estimate.subtotal,
        discountAmount: 0,
        taxAmount: estimate.taxAmount,
        total: estimate.total,
        status: 'Draft',
        notes: estimate.notes,
        terms: estimate.terms,
        createdBy: userId,
      },
    });

    await tx.business.update({
      where: { id: businessId },
      data: { nextInvoiceNo: { increment: 1 } },
    });

    await tx.estimate.update({
      where: { id: estimateId },
      data: { status: EstimateStatus.Accepted },
    });

    return inv;
  });

  await logStatusChange({
    entity: 'Estimate',
    entityId: estimateId,
    action: 'CONVERT_TO_INVOICE',
    oldValue: EstimateStatus.Accepted,
    newValue: `Invoice:${invoiceNumber}`,
    description: `Estimate ${estimate.estimateNumber} converted to Invoice ${invoiceNumber}`,
    changedBy: userId,
  });

  return invoice;
}

export async function deleteEstimate(estimateId: string, userId: string) {
  const estimate = await prisma.estimate.findFirst({
    where: { id: estimateId, userId, deletedAt: null },
  });

  if (!estimate) {
    throw new AppError('Estimate not found', 404);
  }

  await prisma.estimate.update({
    where: { id: estimateId },
    data: { deletedAt: new Date() },
  });

  await logStatusChange({
    entity: 'Estimate',
    entityId: estimateId,
    action: 'DELETE',
    oldValue: estimate.status,
    newValue: 'Deleted',
    description: `Estimate ${estimate.estimateNumber} deleted`,
    changedBy: userId,
  });

  return { message: 'Estimate deleted successfully' };
}
