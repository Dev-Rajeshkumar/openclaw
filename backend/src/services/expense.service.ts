import prisma from '../prisma/index.js';
import { AppError } from '../utils/response.js';
import { logStatusChange } from './statusLog.service.js';

export async function createExpense(
  userId: string,
  businessId: string,
  data: {
    category: string;
    amount: number;
    description?: string;
    receiptUrl?: string;
    date?: Date;
    taxAmount?: number;
  }
) {
  const expense = await prisma.expense.create({
    data: {
      userId,
      businessId,
      category: data.category,
      amount: data.amount,
      description: data.description,
      receiptUrl: data.receiptUrl,
      date: data.date || new Date(),
      taxAmount: data.taxAmount,
    },
  });

  await logStatusChange({
    entity: 'Expense',
    entityId: expense.id,
    action: 'CREATE',
    newValue: data.category,
    description: `Expense of INR ${data.amount} recorded`,
    changedBy: userId,
  });

  return expense;
}

export async function getExpenses(
  userId: string,
  businessId: string,
  page: number = 1,
  limit: number = 20,
  category?: string,
  startDate?: string,
  endDate?: string
) {
  const skip = (page - 1) * limit;

  const where: any = {
    userId,
    businessId,
    deletedAt: null,
  };

  if (category) where.category = category;

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ]);

  return { expenses, total, page, limit };
}

export async function getExpenseById(expenseId: string, userId: string) {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, userId, deletedAt: null },
  });

  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  return expense;
}

export async function updateExpense(
  expenseId: string,
  userId: string,
  data: {
    category?: string;
    amount?: number;
    description?: string;
    receiptUrl?: string;
    date?: Date;
    taxAmount?: number;
  }
) {
  const oldExpense = await prisma.expense.findFirst({
    where: { id: expenseId, userId, deletedAt: null },
  });

  if (!oldExpense) {
    throw new AppError('Expense not found', 404);
  }

  const expense = await prisma.expense.update({
    where: { id: expenseId },
    data: {
      ...(data.category && { category: data.category }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.receiptUrl !== undefined && { receiptUrl: data.receiptUrl }),
      ...(data.date && { date: data.date }),
      ...(data.taxAmount !== undefined && { taxAmount: data.taxAmount }),
    },
  });

  await logStatusChange({
    entity: 'Expense',
    entityId: expenseId,
    action: 'UPDATE',
    description: `Expense updated`,
    changedBy: userId,
  });

  return expense;
}

export async function deleteExpense(expenseId: string, userId: string) {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, userId, deletedAt: null },
  });

  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  await prisma.expense.update({
    where: { id: expenseId },
    data: { deletedAt: new Date() },
  });

  await logStatusChange({
    entity: 'Expense',
    entityId: expenseId,
    action: 'DELETE',
    description: `Expense deleted`,
    changedBy: userId,
  });

  return { message: 'Expense deleted successfully' };
}

export async function getExpenseStats(
  userId: string,
  businessId: string
) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [totalExpenses, monthlyExpenses, yearlyExpenses, byCategory] =
    await Promise.all([
      prisma.expense.aggregate({
        where: { userId, businessId, deletedAt: null },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { userId, businessId, deletedAt: null, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { userId, businessId, deletedAt: null, date: { gte: startOfYear } },
        _sum: { amount: true },
      }),
      prisma.expense.groupBy({
        by: ['category'],
        where: { userId, businessId, deletedAt: null },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

  return {
    totalAmount: totalExpenses._sum.amount || 0,
    monthlyAmount: monthlyExpenses._sum.amount || 0,
    yearlyAmount: yearlyExpenses._sum.amount || 0,
    byCategory: byCategory.map((c) => ({
      category: c.category,
      amount: c._sum.amount || 0,
      count: c._count,
    })),
  };
}
