import { Response, NextFunction } from 'express';
import prisma from '../prisma/index.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

function getDateRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date();
  let start: Date;

  switch (period) {
    case 'week':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case 'all':
      start = new Date(0);
      break;
    case 'month':
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }

  return { start, end };
}

export const getSummary = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { businessId } = req.params;
    const period = (req.query.period as string) || 'month';
    const { start, end } = getDateRange(period);

    const [totalRevenue, totalExpenses, invoiceStats, clientStats] = await Promise.all([
      prisma.invoice.aggregate({
        where: { userId, businessId, deletedAt: null, status: 'Paid', createdAt: { gte: start, lte: end } },
        _sum: { total: true },
      }),
      prisma.expense.aggregate({
        where: { userId, businessId, deletedAt: null, createdAt: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      prisma.invoice.groupBy({
        by: ['status'],
        where: { userId, businessId, deletedAt: null },
        _count: { id: true },
      }),
      prisma.business.findFirst({
        where: { id: businessId, userId, deletedAt: null },
        include: {
          _count: {
            select: {
              clients: { where: { deletedAt: null } },
            },
          },
        },
      }),
    ]);

    const invoiceCounts: Record<string, number> = {};
    for (const stat of invoiceStats) {
      invoiceCounts[stat.status] = stat._count.id;
    }

    const revenue = totalRevenue._sum.total || 0;
    const expenses = totalExpenses._sum.amount || 0;

    res.json(ApiResponse.success({
      totalRevenue: revenue,
      totalExpenses: expenses,
      netProfit: Math.round((revenue - expenses) * 100) / 100,
      totalInvoices: invoiceStats.reduce((sum, s) => sum + s._count.id, 0),
      paidInvoices: invoiceCounts['Paid'] || 0,
      pendingInvoices: (invoiceCounts['Sent'] || 0) + (invoiceCounts['Viewed'] || 0) + (invoiceCounts['PartiallyPaid'] || 0),
      overdueInvoices: invoiceCounts['Overdue'] || 0,
      totalClients: clientStats?._count?.clients || 0,
      activeClients: clientStats?._count?.clients || 0,
    }));
  } catch (error) {
    next(error);
  }
};

const toCSV = (headers: string[], rows: (string | number)[][]): string => {
  const escape = (val: string | number) => '"' + String(val).replace(/"/g, '""') + '"';
  const lines = [headers.map(escape).join(',')];
  for (const row of rows) lines.push(row.map(escape).join(','));
  return lines.join('\n');
};

export const exportData = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const businessId = req.headers['x-business-id'] as string;
    const { type } = req.query;

    let csv = '';

    if (type === 'invoices') {
      const invoices = await prisma.invoice.findMany({
        where: { userId, businessId, deletedAt: null },
        include: { client: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      csv = toCSV(
        ['Number', 'Client', 'Date', 'Due Date', 'Subtotal', 'Tax', 'Total', 'Status'],
        invoices.map((i) => [i.invoiceNumber, i.client?.name || '', i.invoiceDate.toISOString().split('T')[0], i.dueDate.toISOString().split('T')[0], i.subtotal, i.taxAmount, i.total, i.status])
      );
    } else if (type === 'clients') {
      const clients = await prisma.client.findMany({
        where: { userId, businessId, deletedAt: null },
        orderBy: { name: 'asc' },
      });
      csv = toCSV(
        ['Name', 'Company', 'Email', 'Phone', 'GST', 'Status'],
        clients.map((c) => [c.name, c.company || '', c.email || '', c.phone || '', c.gstNumber || '', c.status])
      );
    } else if (type === 'payments') {
      const payments = await prisma.payment.findMany({
        where: { userId, deletedAt: null },
        include: { invoice: { select: { invoiceNumber: true } } },
        orderBy: { createdAt: 'desc' },
      });
      csv = toCSV(
        ['Invoice', 'Amount', 'Method', 'Reference', 'Status', 'Date'],
        payments.map((p) => [p.invoice?.invoiceNumber || '', p.amount, p.method, p.reference || '', p.status, p.paidAt?.toISOString().split('T')[0] || ''])
      );
    } else if (type === 'expenses') {
      const expenses = await prisma.expense.findMany({
        where: { userId, businessId, deletedAt: null },
        orderBy: { date: 'desc' },
      });
      csv = toCSV(
        ['Date', 'Category', 'Amount', 'Description', 'Tax'],
        expenses.map((e) => [e.date.toISOString().split('T')[0], e.category, e.amount, e.description || '', e.taxAmount || 0])
      );
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};
