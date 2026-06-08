import { Response, NextFunction, Request } from 'express';
import prisma from '../prisma/index.js';
import * as clientPortalService from '../services/clientPortal.service.js';
import { ApiResponse } from '../utils/response.js';

// Send magic link to client email
export const sendMagicLink = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }
    const result = await clientPortalService.sendClientMagicLink(email);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

// Verify magic link token and return JWT
export const verifyMagicLink = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, message: 'Token is required' });
      return;
    }
    const result = await clientPortalService.verifyClientMagicLink(token);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

// Get client's own invoices
export const getMyInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clientId = (req as any).client?.id;
    const businessId = (req as any).client?.businessId;

    if (!clientId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const invoices = await prisma.invoice.findMany({
      where: { clientId, businessId, deletedAt: null },
      include: { client: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(ApiResponse.success(invoices));
  } catch (error) {
    next(error);
  }
};

// Get single invoice for client
export const getMyInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clientId = (req as any).client?.id;
    const { id } = req.params;

    if (!clientId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id, clientId, deletedAt: null },
      include: { client: true },
    });

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }

    res.json(ApiResponse.success(invoice));
  } catch (error) {
    next(error);
  }
};

// Get client's payment history
export const getMyPayments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clientId = (req as any).client?.id;

    if (!clientId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const payments = await prisma.payment.findMany({
      where: {
        invoice: { clientId, deletedAt: null },
      },
      include: {
        invoice: { select: { invoiceNumber: true, total: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(ApiResponse.success(payments));
  } catch (error) {
    next(error);
  }
};

// Get client profile
export const getMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clientId = (req as any).client?.id;

    if (!clientId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const client = await prisma.client.findFirst({
      where: { id: clientId, deletedAt: null },
      include: { business: { select: { id: true, name: true } } },
    });

    if (!client) {
      res.status(404).json({ success: false, message: 'Client not found' });
      return;
    }

    res.json(ApiResponse.success({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      gstNumber: client.gstNumber,
      businessId: client.businessId,
      businessName: client.business?.name,
    }));
  } catch (error) {
    next(error);
  }
};
