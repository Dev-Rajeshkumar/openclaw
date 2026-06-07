import prisma from '../prisma/index.js';
import { AppError } from '../utils/response.js';
import { logStatusChange } from './statusLog.service.js';
import { RecurringFrequency, RecurringTemplate, Plan } from '../types/index.js';
import { canPerformAction } from '../utils/planLimits.js';

export async function createRecurringInvoice(
  userId: string,
  businessId: string,
  clientId: string,
  data: {
    template: RecurringTemplate;
    frequency: RecurringFrequency;
    startDate: Date;
    endDate?: Date;
    autoSend?: boolean;
  }
) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!canPerformAction(user.plan as Plan, 'canUseRecurring')) {
    throw new AppError('Recurring invoices require Professional plan or higher', 403);
  }

  const recurring = await prisma.recurringInvoice.create({
    data: {
      userId,
      businessId,
      clientId,
      template: data.template as any,
      frequency: data.frequency,
      startDate: data.startDate,
      endDate: data.endDate,
      nextRun: data.startDate,
      autoSend: data.autoSend || false,
    },
  });

  await logStatusChange({
    entity: 'RecurringInvoice',
    entityId: recurring.id,
    action: 'CREATE',
    newValue: data.frequency,
    description: `Recurring invoice created with ${data.frequency} frequency`,
    changedBy: userId,
  });

  return recurring;
}

export async function getRecurringInvoices(
  userId: string,
  businessId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  const [recurrings, total] = await Promise.all([
    prisma.recurringInvoice.findMany({
      where: { userId, businessId, deletedAt: null },
      include: {
        client: { select: { id: true, name: true, company: true } },
        _count: { select: { invoices: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.recurringInvoice.count({
      where: { userId, businessId, deletedAt: null },
    }),
  ]);

  return { recurrings, total, page, limit };
}

export async function getRecurringInvoiceById(
  recurringId: string,
  userId: string
) {
  const recurring = await prisma.recurringInvoice.findFirst({
    where: { id: recurringId, userId, deletedAt: null },
    include: {
      client: true,
      invoices: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!recurring) {
    throw new AppError('Recurring invoice not found', 404);
  }

  return recurring;
}

export async function updateRecurringInvoice(
  recurringId: string,
  userId: string,
  data: {
    template?: RecurringTemplate;
    frequency?: RecurringFrequency;
    startDate?: Date;
    endDate?: Date;
    autoSend?: boolean;
  }
) {
  const oldRecurring = await prisma.recurringInvoice.findFirst({
    where: { id: recurringId, userId, deletedAt: null },
  });

  if (!oldRecurring) {
    throw new AppError('Recurring invoice not found', 404);
  }

  const recurring = await prisma.recurringInvoice.update({
    where: { id: recurringId },
    data: {
      ...(data.template && { template: data.template as any }),
      ...(data.frequency && { frequency: data.frequency }),
      ...(data.startDate && { startDate: data.startDate }),
      ...(data.endDate !== undefined && { endDate: data.endDate }),
      ...(data.autoSend !== undefined && { autoSend: data.autoSend }),
    },
  });

  await logStatusChange({
    entity: 'RecurringInvoice',
    entityId: recurringId,
    action: 'UPDATE',
    description: 'Recurring invoice updated',
    changedBy: userId,
  });

  return recurring;
}

export async function deleteRecurringInvoice(
  recurringId: string,
  userId: string
) {
  const recurring = await prisma.recurringInvoice.findFirst({
    where: { id: recurringId, userId, deletedAt: null },
  });

  if (!recurring) {
    throw new AppError('Recurring invoice not found', 404);
  }

  await prisma.recurringInvoice.update({
    where: { id: recurringId },
    data: { deletedAt: new Date() },
  });

  await logStatusChange({
    entity: 'RecurringInvoice',
    entityId: recurringId,
    action: 'DELETE',
    description: 'Recurring invoice deleted',
    changedBy: userId,
  });

  return { message: 'Recurring invoice deleted successfully' };
}

/**
 * Get all recurring invoices that are due for processing
 * (nextRun <= now and not deleted)
 */
export async function getDueRecurringInvoices() {
  return prisma.recurringInvoice.findMany({
    where: {
      deletedAt: null,
      nextRun: { lte: new Date() },
      OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
    },
    include: { client: true },
  });
}

/**
 * Calculate the next run date based on frequency
 */
export function calculateNextRun(
  currentRun: Date,
  frequency: RecurringFrequency
): Date {
  const next = new Date(currentRun);
  switch (frequency) {
    case RecurringFrequency.Daily:
      next.setDate(next.getDate() + 1);
      break;
    case RecurringFrequency.Weekly:
      next.setDate(next.getDate() + 7);
      break;
    case RecurringFrequency.Monthly:
      next.setMonth(next.getMonth() + 1);
      break;
    case RecurringFrequency.Quarterly:
      next.setMonth(next.getMonth() + 3);
      break;
    case RecurringFrequency.Yearly:
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}
