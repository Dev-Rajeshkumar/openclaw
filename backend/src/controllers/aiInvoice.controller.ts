import { Response, NextFunction } from 'express';
import prisma from '../prisma/index.js';
import { parseInvoiceText, generateBusinessInsights, generateFollowUp } from '../services/aiInvoice.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

// Parse natural language into invoice data
export const parseInvoice = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ success: false, message: 'Text input is required' });
      return;
    }

    const parsed = parseInvoiceText(text);
    res.json(ApiResponse.success(parsed));
  } catch (error) {
    next(error);
  }
};

// Generate business insights
export const getInsights = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { businessId } = req.params;

    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Gather data
    const [invoices, payments, clients, currentInvoices, previousInvoices, overdueInvoices, paidInvoices] = await Promise.all([
      prisma.invoice.findMany({ where: { userId, businessId, deletedAt: null } }),
      prisma.payment.findMany({ where: { userId, deletedAt: null } }),
      prisma.client.findMany({ where: { userId, businessId, deletedAt: null } }),
      prisma.invoice.findMany({
        where: { userId, businessId, deletedAt: null, createdAt: { gte: currentMonth } },
        select: { total: true, clientId: true, status: true },
      }),
      prisma.invoice.findMany({
        where: { userId, businessId, deletedAt: null, createdAt: { gte: previousMonth, lt: currentMonth } },
        select: { total: true },
      }),
      prisma.invoice.findMany({
        where: {
          userId, businessId, deletedAt: null,
          status: { in: ['Sent', 'Overdue', 'PartiallyPaid'] },
          dueDate: { lt: now },
        },
      }),
      prisma.invoice.findMany({
        where: { userId, businessId, status: 'Paid', deletedAt: null },
        include: { payments: true },
      }),
    ]);

    // Calculate metrics
    const currentMonthRevenue = currentInvoices.reduce((s, i) => s + i.total, 0);
    const previousMonthRevenue = previousInvoices.reduce((s, i) => s + i.total, 0);

    // Client revenue breakdown
    const clientTotals: Record<string, number> = {};
    const clientNames: Record<string, string> = {};
    invoices.forEach((inv: any) => {
      if (inv.clientId) {
        clientTotals[inv.clientId] = (clientTotals[inv.clientId] || 0) + inv.total;
      }
    });
    clients.forEach((c: any) => { clientNames[c.id] = c.name; });

    const topClients = Object.entries(clientTotals)
      .map(([id, total]) => ({ name: clientNames[id] || 'Unknown', total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Average payment days
    let avgPaymentDays = 0;
    if (paidInvoices.length > 0) {
      const totalDays = paidInvoices.reduce((sum: number, inv: any) => {
        if (inv.payments && inv.payments.length > 0) {
          const paymentDate = new Date(inv.payments[0].paidAt || inv.payments[0].createdAt);
          const invoiceDate = new Date(inv.createdAt);
          const days = Math.ceil((paymentDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + Math.max(0, days);
        }
        return sum;
      }, 0);
      avgPaymentDays = totalDays / paidInvoices.length;
    }

    const insights = generateBusinessInsights({
      invoices,
      payments,
      clients,
      currentMonth: currentInvoices.length,
      previousMonth: previousInvoices.length,
      currentMonthRevenue,
      previousMonthRevenue,
      overdueInvoices,
      topClients,
      avgPaymentDays,
    });

    res.json(ApiResponse.success({
      insights,
      metrics: {
        totalInvoices: invoices.length,
        currentMonth: currentInvoices.length,
        previousMonth: previousInvoices.length,
        currentMonthRevenue,
        previousMonthRevenue,
        overdueCount: overdueInvoices.length,
        totalClients: clients.length,
        avgPaymentDays: Math.round(avgPaymentDays),
        topClients,
      },
    }));
  } catch (error) {
    next(error);
  }
};

// Generate follow-up message for an invoice
export const generateFollowUpMessage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: { id, userId, deletedAt: null },
      include: { client: true },
    });

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }

    const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
    const daysOverdue = dueDate
      ? Math.max(0, Math.ceil((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    const messages = generateFollowUp(invoice, daysOverdue);
    res.json(ApiResponse.success({ messages, daysOverdue }));
  } catch (error) {
    next(error);
  }
};
