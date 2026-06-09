import { Response, NextFunction } from 'express';
import prisma from '../prisma/index.js';
import * as invoiceService from '../services/invoice.service.js';
import * as templateService from '../services/invoiceTemplate.service.js';
import { generateInvoicePDF } from '../utils/pdf.js';
import { sendInvoiceEmail } from '../utils/email.js';
import { AuthenticatedRequest, InvoiceStatus, TeamRole } from '../types/index.js';
import { ApiResponse, AppError } from '../utils/response.js';
import { logStatusChange } from '../services/statusLog.service.js';

/**
 * Check if user has a privileged role (Owner, Admin, or Accountant) in the business.
 * Returns the team member record or null.
 */
async function getPrivilegedMember(userId: string, businessId: string) {
  // Check if user is the business owner
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId, deletedAt: null },
  });
  if (business) {
    return { role: TeamRole.Owner };
  }

  // Check team membership
  const member = await prisma.teamMember.findFirst({
    where: { businessId, userId, deletedAt: null },
  });
  if (member && [TeamRole.Owner, TeamRole.Admin, TeamRole.Accountant].includes(member.role)) {
    return member;
  }
  return null;
}

/**
 * Create a notification for all privileged users in a business
 */
async function notifyPrivilegedUsers(businessId: string, excludeUserId: string, title: string, message: string, type: string, link?: string) {
  // Get business owner
  const business = await prisma.business.findFirst({
    where: { id: businessId, deletedAt: null },
  });

  const notifyUserIds = new Set<string>();
  if (business) notifyUserIds.add(business.userId);

  // Get privileged team members
  const privilegedMembers = await prisma.teamMember.findMany({
    where: {
      businessId,
      deletedAt: null,
      role: { in: [TeamRole.Owner, TeamRole.Admin, TeamRole.Accountant] },
    },
  });
  privilegedMembers.forEach((m) => notifyUserIds.add(m.userId));

  // Exclude the actor
  notifyUserIds.delete(excludeUserId);

  if (notifyUserIds.size === 0) return;

  await prisma.notification.createMany({
    data: Array.from(notifyUserIds).map((uid) => ({
      userId: uid,
      title,
      message,
      type: type as any,
      link,
    })),
  });
}

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
      userId, businessId, page, limit, status, search, startDate, endDate
    );
    res.status(200).json(ApiResponse.paginated(
      result.invoices, result.page, result.limit, result.total
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
      id, userId, status as InvoiceStatus
    );
    res.status(200).json(ApiResponse.success(invoice, 'Invoice status updated'));
  } catch (error) {
    next(error);
  }
};

export const sendEmail = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId, deletedAt: null },
      include: { client: true, business: true },
    });
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }
    if (!invoice.client?.email) {
      res.status(400).json({ success: false, message: 'Client has no email address' });
      return;
    }
    const sent = await sendInvoiceEmail(
      invoice.client.email,
      invoice.invoiceNumber,
      invoice.business?.name || 'BillingBee',
      invoice.total,
      invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'N/A',
    );
    if (sent) {
      res.json(ApiResponse.success(null, `Invoice sent to ${invoice.client.email}`));
    } else {
      res.status(500).json({ success: false, message: 'Failed to send email' });
    }
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
    const { id, businessId } = req.params;
    const templateSlug = (req.query.template as string) || null;

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

    // Determine which template to use
    let template = null;
    if (templateSlug) {
      try {
        template = await templateService.getTemplateBySlug(templateSlug, userId, businessId);
      } catch {
        // Fall back to default
      }
    }
    if (!template) {
      // Use stored template or default
      const defaultSlug = invoice.invoiceTemplateId
        ? 'classic'
        : await templateService.getDefaultTemplateSlug(businessId);
      try {
        template = await templateService.getTemplateBySlug(defaultSlug, userId, businessId);
      } catch {
        // Use classic as ultimate fallback
        template = templateService.BUILT_IN_TEMPLATES[0];
      }
    }

    // Merge text overrides: per-invoice stored overrides + query param overrides (premium)
    const storedOverrides = (invoice as any).templateTextOverrides || {};
    const queryOverrides: Record<string, string> = {};
    const textKeys = ['labelInvoiceTitle','labelBillTo','labelNotes','labelTerms','labelSubtotal','labelDiscount','labelTax','labelTotal','footerText'];
    textKeys.forEach((k) => {
      const v = req.query[k];
      if (typeof v === 'string' && v) queryOverrides[k] = v;
    });
    const mergedOverrides = { ...storedOverrides, ...queryOverrides };
    if (Object.keys(mergedOverrides).length > 0) {
      template = templateService.mergeTemplateTextOverrides(template, mergedOverrides);
    }

    const doc = generateInvoicePDF({
      invoice: invoice as any,
      client: invoice.client || ({} as any),
      business: business || ({} as any),
      template: template || undefined,
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

export const duplicateInvoice = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { id, businessId } = req.params;
    const newInvoice = await invoiceService.duplicateInvoice(id, userId, businessId);
    res.status(201).json(ApiResponse.created(newInvoice, 'Invoice duplicated successfully'));
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

// ─── Approval Workflow ────────────────────────────────────

export const submitForReview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const oldInvoice = await prisma.invoice.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!oldInvoice) {
      throw new AppError('Invoice not found', 404);
    }

    if (oldInvoice.status !== InvoiceStatus.Draft && oldInvoice.status !== InvoiceStatus.Rejected) {
      throw new AppError('Only draft or rejected invoices can be submitted for review', 400);
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.PendingReview },
    });

    await logStatusChange({
      entity: 'Invoice',
      entityId: id,
      action: 'STATUS_CHANGE',
      oldValue: oldInvoice.status,
      newValue: InvoiceStatus.PendingReview,
      description: `Invoice ${oldInvoice.invoiceNumber} submitted for review`,
      changedBy: userId,
    });

    // Notify admins/owners
    await notifyPrivilegedUsers(
      oldInvoice.businessId,
      userId,
      'Invoice Submitted for Review',
      `Invoice ${oldInvoice.invoiceNumber} has been submitted for your review.`,
      'Invoice',
      `/dashboard/invoices/${id}`
    );

    res.status(200).json(ApiResponse.success(invoice, 'Invoice submitted for review'));
  } catch (error) {
    next(error);
  }
};

export const approveInvoice = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const businessId = (req.params.businessId || req.headers['x-business-id'] as string);

    // Check role
    const member = await getPrivilegedMember(userId, businessId);
    if (!member) {
      throw new AppError('Only Owner, Admin, or Accountant can approve invoices', 403);
    }

    const oldInvoice = await prisma.invoice.findFirst({
      where: { id, deletedAt: null },
    });

    if (!oldInvoice) {
      throw new AppError('Invoice not found', 404);
    }

    if (oldInvoice.status !== InvoiceStatus.PendingReview) {
      throw new AppError('Only pending review invoices can be approved', 400);
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.Approved,
        reviewerId: userId,
        reviewedAt: new Date(),
      },
    });

    await logStatusChange({
      entity: 'Invoice',
      entityId: id,
      action: 'STATUS_CHANGE',
      oldValue: oldInvoice.status,
      newValue: InvoiceStatus.Approved,
      description: `Invoice ${oldInvoice.invoiceNumber} approved`,
      changedBy: userId,
    });

    // Notify invoice creator
    if (oldInvoice.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: oldInvoice.userId,
          title: 'Invoice Approved',
          message: `Invoice ${oldInvoice.invoiceNumber} has been approved and is ready to send.`,
          type: 'Invoice',
          link: `/dashboard/invoices/${id}`,
        },
      });
    }

    res.status(200).json(ApiResponse.success(invoice, 'Invoice approved'));
  } catch (error) {
    next(error);
  }
};

export const rejectInvoice = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const businessId = (req.params.businessId || req.headers['x-business-id'] as string);
    const { notes } = req.body;

    // Check role
    const member = await getPrivilegedMember(userId, businessId);
    if (!member) {
      throw new AppError('Only Owner, Admin, or Accountant can reject invoices', 403);
    }

    const oldInvoice = await prisma.invoice.findFirst({
      where: { id, deletedAt: null },
    });

    if (!oldInvoice) {
      throw new AppError('Invoice not found', 404);
    }

    if (oldInvoice.status !== InvoiceStatus.PendingReview) {
      throw new AppError('Only pending review invoices can be rejected', 400);
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.Rejected,
        reviewerId: userId,
        reviewedAt: new Date(),
        reviewNotes: notes || null,
      },
    });

    await logStatusChange({
      entity: 'Invoice',
      entityId: id,
      action: 'STATUS_CHANGE',
      oldValue: oldInvoice.status,
      newValue: InvoiceStatus.Rejected,
      description: `Invoice ${oldInvoice.invoiceNumber} rejected${notes ? `: ${notes}` : ''}`,
      changedBy: userId,
      metadata: notes ? { notes } : undefined,
    });

    // Notify invoice creator
    if (oldInvoice.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: oldInvoice.userId,
          title: 'Invoice Rejected',
          message: `Invoice ${oldInvoice.invoiceNumber} was rejected.${notes ? ` Reason: ${notes}` : ''}`,
          type: 'Invoice',
          link: `/dashboard/invoices/${id}`,
        },
      });
    }

    res.status(200).json(ApiResponse.success(invoice, 'Invoice rejected'));
  } catch (error) {
    next(error);
  }
};

export const sendApprovedInvoice = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const oldInvoice = await prisma.invoice.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!oldInvoice) {
      throw new AppError('Invoice not found', 404);
    }

    if (oldInvoice.status !== InvoiceStatus.Approved) {
      throw new AppError('Only approved invoices can be sent', 400);
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.Sent },
    });

    await logStatusChange({
      entity: 'Invoice',
      entityId: id,
      action: 'STATUS_CHANGE',
      oldValue: oldInvoice.status,
      newValue: InvoiceStatus.Sent,
      description: `Invoice ${oldInvoice.invoiceNumber} sent to client`,
      changedBy: userId,
    });

    // Notify team
    await notifyPrivilegedUsers(
      oldInvoice.businessId,
      userId,
      'Invoice Sent',
      `Invoice ${oldInvoice.invoiceNumber} has been sent to the client.`,
      'Invoice',
      `/dashboard/invoices/${id}`
    );

    res.status(200).json(ApiResponse.success(invoice, 'Invoice sent successfully'));
  } catch (error) {
    next(error);
  }
};
