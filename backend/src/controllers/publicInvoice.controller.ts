import { Response, NextFunction, Request } from 'express';
import prisma from '../prisma/index.js';
import { generateInvoicePDF } from '../utils/pdf-templates/index.js';
import * as templateService from '../services/invoiceTemplate.service.js';
import { ApiResponse } from '../utils/response.js';

export const getPublicInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: { publicAccessToken: token, deletedAt: null },
      include: { client: true },
    });

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }

    const business = await prisma.business.findFirst({
      where: { id: invoice.businessId, deletedAt: null },
    });

    // Track view
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });

    res.json(ApiResponse.success({
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        items: invoice.items,
        subtotal: invoice.subtotal,
        discountAmount: invoice.discountAmount,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        status: invoice.status,
        notes: invoice.notes,
        terms: invoice.terms,
        viewCount: updatedInvoice.viewCount,
        lastViewedAt: updatedInvoice.lastViewedAt,
      },
      client: invoice.client ? {
        name: invoice.client.name,
        email: invoice.client.email,
        phone: invoice.client.phone,
        gstNumber: invoice.client.gstNumber,
        address: invoice.client.address,
      } : null,
      business: business ? {
        name: business.name,
        gstNumber: business.gstNumber,
        phone: business.phone,
        address: business.address,
        logo: business.logo,
      } : null,
    }));
  } catch (error) {
    next(error);
  }
};

export const getPublicInvoicePDF = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: { publicAccessToken: token, deletedAt: null },
      include: { client: true },
    });

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }

    const business = await prisma.business.findFirst({
      where: { id: invoice.businessId, deletedAt: null },
    });

    // Get template
    let template = null;
    if (invoice.invoiceTemplateId) {
      try {
        template = await templateService.getTemplateBySlug(invoice.invoiceTemplateId, invoice.userId, invoice.businessId);
      } catch {
        // fallback
      }
    }
    if (!template) {
      template = templateService.BUILT_IN_TEMPLATES[0];
    }

    // Merge text overrides
    const textOverrides = (invoice as any).templateTextOverrides || {};
    if (Object.keys(textOverrides).length > 0) {
      template = templateService.mergeTemplateTextOverrides(template, textOverrides);
    }

    const doc = generateInvoicePDF({
      invoice: invoice as any,
      client: invoice.client || ({} as any),
      business: business || ({} as any),
      template: template || undefined,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber}.pdf"`);
    doc.pipe(res);
    doc.end();
  } catch (error) {
    next(error);
  }
};
