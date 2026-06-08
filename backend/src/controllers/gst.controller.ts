import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

const prisma = new PrismaClient();

export const getGSTSummary = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const businessId = req.headers['x-business-id'] as string;
    const { startDate, endDate, quarter, year } = req.query;

    // Build date filter
    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    } else if (quarter && year) {
      const q = parseInt(quarter as string);
      const y = parseInt(year as string);
      const startMonth = (q - 1) * 3;
      dateFilter = {
        gte: new Date(y, startMonth, 1),
        lt: new Date(y, startMonth + 3, 1),
      };
    } else {
      // Default: current financial year (Apr-Mar)
      const now = new Date();
      const fyStart = now.getMonth() >= 3
        ? new Date(now.getFullYear(), 3, 1)
        : new Date(now.getFullYear() - 1, 3, 1);
      dateFilter = { gte: fyStart };
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        userId,
        businessId,
        deletedAt: null,
        status: { not: 'Draft' },
        invoiceDate: dateFilter,
      },
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        subtotal: true,
        taxAmount: true,
        total: true,
        status: true,
        client: { select: { name: true, gstNumber: true } },
      },
      orderBy: { invoiceDate: 'desc' },
    });

    // Calculate GST breakdown
    const summary = {
      totalInvoices: invoices.length,
      totalTaxableValue: 0,
      totalCGST: 0,
      totalSGST: 0,
      totalIGST: 0,
      totalCESS: 0,
      totalTax: 0,
      totalInvoiceValue: 0,
      byRate: {} as Record<string, { taxableValue: number; cgst: number; sgst: number; igst: number; cess: number; totalTax: number; invoiceCount: number }>,
    };

    for (const inv of invoices) {
      summary.totalTaxableValue += inv.subtotal;
      summary.totalTax += inv.taxAmount;
      summary.totalInvoiceValue += inv.total;

      // Assume 50/50 split for CGST/SGST (intra-state) — in production this would come from invoice data
      const halfTax = inv.taxAmount / 2;
      summary.totalCGST += halfTax;
      summary.totalSGST += halfTax;

      // Group by tax rate (default 18% if not specified)
      const rateKey = '18';
      if (!summary.byRate[rateKey]) {
        summary.byRate[rateKey] = { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, totalTax: 0, invoiceCount: 0 };
      }
      summary.byRate[rateKey].taxableValue += inv.subtotal;
      summary.byRate[rateKey].cgst += halfTax;
      summary.byRate[rateKey].sgst += halfTax;
      summary.byRate[rateKey].totalTax += inv.taxAmount;
      summary.byRate[rateKey].invoiceCount += 1;
    }

    res.status(200).json(ApiResponse.success({
      period: { startDate, endDate, quarter, year },
      summary,
      invoices: invoices.slice(0, 100), // Limit detail rows
    }));
  } catch (error) {
    next(error);
  }
};

export const getGSTR1 = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const businessId = req.headers['x-business-id'] as string;
    const { month, year } = req.query;

    const startDate = new Date(
      parseInt(year as string) || new Date().getFullYear(),
      parseInt(month as string) || new Date().getMonth(),
      1
    );
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    const invoices = await prisma.invoice.findMany({
      where: {
        userId,
        businessId,
        deletedAt: null,
        status: { not: 'Draft' },
        invoiceDate: { gte: startDate, lte: endDate },
      },
      include: {
        client: { select: { name: true, gstNumber: true } },
      },
      orderBy: { invoiceDate: 'asc' },
    });

    // Format for GSTR-1 (outward supplies)
    const b2bInvoices = invoices
      .filter((inv) => inv.client?.gstNumber)
      .map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        clientName: inv.client?.name || '',
        clientGST: inv.client?.gstNumber || '',
        taxableValue: inv.subtotal,
        taxAmount: inv.taxAmount,
        totalValue: inv.total,
        status: inv.status,
      }));

    const b2cInvoices = invoices
      .filter((inv) => !inv.client?.gstNumber)
      .map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        clientName: inv.client?.name || '',
        taxableValue: inv.subtotal,
        taxAmount: inv.taxAmount,
        totalValue: inv.total,
        status: inv.status,
      }));

    res.status(200).json(ApiResponse.success({
      period: { month: startDate.getMonth(), year: startDate.getFullYear() },
      b2b: { count: b2bInvoices.length, invoices: b2bInvoices },
      b2c: { count: b2cInvoices.length, invoices: b2cInvoices },
      totals: {
        b2bTaxable: b2bInvoices.reduce((s, i) => s + i.taxableValue, 0),
        b2bTax: b2bInvoices.reduce((s, i) => s + i.taxAmount, 0),
        b2cTaxable: b2cInvoices.reduce((s, i) => s + i.taxableValue, 0),
        b2cTax: b2cInvoices.reduce((s, i) => s + i.taxAmount, 0),
      },
    }));
  } catch (error) {
    next(error);
  }
};
