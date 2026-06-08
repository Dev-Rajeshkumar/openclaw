import { Response, NextFunction } from 'express';
import prisma from '../prisma/index.js';
import * as invoiceService from '../services/invoice.service.js';
import { generateInvoicePDF } from '../utils/pdf.js';
import { AuthenticatedRequest, InvoiceStatus } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

export const create = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { businessId } = req.params;
    const invoice = await invoiceService.createInvoice(userId, businessId, req.body);
    res.status(201).json(ApiResponse.created(invoice, 'Invoice created successfully'));
  } catch (error) {
    next(error);
  }
};

export const getAll = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { businessId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const result = await invoiceService.getInvoices(
      userId,
      businessId,
      page,
      limit,
      status,
      search,
      startDate,
      endDate
    );
    res.status(200).json(ApiResponse.paginated(
      result.invoices,
      result.page,
      result.limit,
      result.total
    ));
  } catch (error) {
    next(error);
  }
};

export const getById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const invoice = await invoiceService.getInvoiceById(id, userId);
    res.status(200).json(ApiResponse.success(invoice));
  } catch (error) {
    next(error);
  }
};

export const update = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const invoice = await invoiceService.updateInvoice(id, userId, req.body);
    res.status(200).json(ApiResponse.success(invoice, 'Invoice updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { status } = req.body;
    const invoice = await invoiceService.updateInvoiceStatus(
      id,
      userId,
      status as InvoiceStatus
    );
    res.status(200).json(ApiResponse.success(invoice, 'Invoice status updated'));
  } catch (error) {
    next(error);
  }
};

export const downloadPDF = async (
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
    const business = await prisma.business.findFirst({
      where: { id: invoice.businessId, deletedAt: null },
    });
    const doc = generateInvoicePDF({
      invoice: invoice as any,
      client: invoice.client || ({} as any),
      business: business || ({} as any),
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    doc.pipe(res);
    doc.end();
  } catch (error) {
    next(error);
  }
};

export const remove = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const result = await invoiceService.deleteInvoice(id, userId);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

export const getStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { businessId } = req.params;
    const stats = await invoiceService.getInvoiceStats(userId, businessId);
    res.status(200).json(ApiResponse.success(stats));
  } catch (error) {
    next(error);
  }
};
