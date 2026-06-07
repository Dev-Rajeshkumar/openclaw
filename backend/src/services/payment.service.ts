import prisma from '../prisma/index.js';
import { AppError } from '../utils/response.js';
import { logStatusChange } from './statusLog.service.js';
import { PaymentMethod, PaymentStatus, InvoiceStatus } from '../types/index.js';
import { notifyPaymentReceived } from './notification.service.js';

export async function createPayment(
  userId: string,
  invoiceId: string,
  data: {
    amount: number;
    method: PaymentMethod;
    reference?: string;
    notes?: string;
    paidAt?: Date;
  }
) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId, deletedAt: null },
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  if (invoice.status === InvoiceStatus.Paid) {
    throw new AppError('Invoice is already fully paid', 400);
  }

  if (invoice.status === InvoiceStatus.Cancelled) {
    throw new AppError('Cannot record payment for a cancelled invoice', 400);
  }

  // Get total paid so far
  const paymentsAgg = await prisma.payment.aggregate({
    where: { invoiceId, deletedAt: null, status: 'Completed' },
    _sum: { amount: true },
  });

  const totalPaid = (paymentsAgg._sum.amount || 0) + data.amount;

  if (totalPaid > invoice.total) {
    throw new AppError(
      `Payment amount exceeds outstanding balance. Outstanding: INR ${(invoice.total - (paymentsAgg._sum.amount || 0)).toFixed(2)}`,
      400
    );
  }

  const payment = await prisma.payment.create({
    data: {
      invoiceId,
      userId,
      amount: data.amount,
      method: data.method,
      reference: data.reference,
      notes: data.notes,
      status: PaymentStatus.Completed,
      paidAt: data.paidAt || new Date(),
    },
  });

  // Update invoice status
  let newStatus: InvoiceStatus;
  if (totalPaid >= invoice.total) {
    newStatus = InvoiceStatus.Paid;
  } else {
    newStatus = InvoiceStatus.PartiallyPaid;
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: newStatus },
  });

  await logStatusChange({
    entity: 'Payment',
    entityId: payment.id,
    action: 'CREATE',
    newValue: PaymentStatus.Completed,
    description: `Payment of INR ${data.amount} recorded for invoice ${invoice.invoiceNumber}`,
    changedBy: userId,
  });

  await logStatusChange({
    entity: 'Invoice',
    entityId: invoiceId,
    action: 'STATUS_CHANGE',
    oldValue: invoice.status,
    newValue: newStatus,
    description: `Invoice ${invoice.invoiceNumber} status: ${invoice.status} → ${newStatus}`,
    changedBy: userId,
  });

  notifyPaymentReceived(invoice.invoiceNumber, data.amount, data.method).catch(() => {});

  return payment;
}

export async function getPayments(
  userId: string,
  page: number = 1,
  limit: number = 20,
  invoiceId?: string,
  startDate?: string,
  endDate?: string
) {
  const skip = (page - 1) * limit;

  const where: any = {
    userId,
    deletedAt: null,
  };

  if (invoiceId) where.invoiceId = invoiceId;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        invoice: {
          select: { id: true, invoiceNumber: true, total: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);

  return { payments, total, page, limit };
}

export async function getPaymentById(paymentId: string, userId: string) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, userId, deletedAt: null },
    include: { invoice: true },
  });

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  return payment;
}

export async function deletePayment(paymentId: string, userId: string) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, userId, deletedAt: null },
  });

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: { deletedAt: new Date() },
    });

    // Recalculate invoice status
    const invoice = await tx.invoice.findUnique({
      where: { id: payment.invoiceId },
    });

    if (invoice) {
      const paymentsAgg = await tx.payment.aggregate({
        where: { invoiceId: payment.invoiceId, deletedAt: null, status: 'Completed' },
        _sum: { amount: true },
      });

      const totalPaid = paymentsAgg._sum.amount || 0;
      let newStatus: InvoiceStatus;

      if (totalPaid >= invoice.total) {
        newStatus = InvoiceStatus.Paid;
      } else if (totalPaid > 0) {
        newStatus = InvoiceStatus.PartiallyPaid;
      } else {
        newStatus = InvoiceStatus.Sent;
      }

      await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: { status: newStatus },
      });
    }
  });

  await logStatusChange({
    entity: 'Payment',
    entityId: paymentId,
    action: 'DELETE',
    description: `Payment deleted`,
    changedBy: userId,
  });

  return { message: 'Payment deleted successfully' };
}

export async function getPaymentStats(userId: string, businessId?: string) {
  const where: any = { userId, deletedAt: null, status: 'Completed' };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalPayments, monthlyPayments] = await Promise.all([
    prisma.payment.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { ...where, createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return {
    totalAmount: totalPayments._sum.amount || 0,
    totalCount: totalPayments._count,
    monthlyAmount: monthlyPayments._sum.amount || 0,
    monthlyCount: monthlyPayments._count,
  };
}
