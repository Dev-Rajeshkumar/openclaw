import prisma from '../prisma/index.js';
import { AppError } from '../utils/response.js';
import { logStatusChange } from './statusLog.service.js';
import { isWithinLimit } from '../utils/planLimits.js';
import { Plan } from '../types/index.js';

export async function createBusiness(
  userId: string,
  data: {
    name: string;
    gstNumber?: string;
    pan?: string;
    phone?: string;
    address?: string;
    logo?: string;
    invoicePrefix?: string;
  }
) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check plan limits
  const businessCount = await prisma.business.count({
    where: { userId, deletedAt: null },
  });

  if (!isWithinLimit(user.plan as Plan, 'maxBusinesses', businessCount)) {
    throw new AppError(
      `Your plan allows maximum ${user.plan} business(es). Upgrade to add more.`,
      403
    );
  }

  const business = await prisma.business.create({
    data: {
      userId,
      name: data.name,
      gstNumber: data.gstNumber,
      pan: data.pan,
      phone: data.phone,
      address: data.address,
      logo: data.logo,
      invoicePrefix: data.invoicePrefix || 'INV',
      nextInvoiceNo: 1,
    },
  });

  // Add user as Owner in TeamMember
  await prisma.teamMember.create({
    data: {
      businessId: business.id,
      userId,
      role: 'Owner',
      permissions: ['*'],
      invitedBy: userId,
    },
  });

  await logStatusChange({
    entity: 'Business',
    entityId: business.id,
    action: 'CREATE',
    newValue: 'Active',
    description: `Business "${data.name}" created`,
    changedBy: userId,
  });

  return business;
}

export async function getBusinesses(userId: string) {
  return prisma.business.findMany({
    where: { userId, deletedAt: null },
    include: {
      _count: {
        select: {
          clients: { where: { deletedAt: null } },
          invoices: { where: { deletedAt: null } },
          teamMembers: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getBusinessById(businessId: string, userId: string) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId, deletedAt: null },
    include: {
      _count: {
        select: {
          clients: { where: { deletedAt: null } },
          invoices: { where: { deletedAt: null } },
          products: { where: { deletedAt: null } },
          services: { where: { deletedAt: null } },
          teamMembers: { where: { deletedAt: null } },
        },
      },
    },
  });

  if (!business) {
    throw new AppError('Business not found', 404);
  }

  return business;
}

export async function updateBusiness(
  businessId: string,
  userId: string,
  data: {
    name?: string;
    gstNumber?: string;
    pan?: string;
    phone?: string;
    address?: string;
    logo?: string;
    invoicePrefix?: string;
  }
) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId, deletedAt: null },
  });

  if (!business) {
    throw new AppError('Business not found', 404);
  }

  const updated = await prisma.business.update({
    where: { id: businessId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.gstNumber !== undefined && { gstNumber: data.gstNumber }),
      ...(data.pan !== undefined && { pan: data.pan }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.logo !== undefined && { logo: data.logo }),
      ...(data.invoicePrefix && { invoicePrefix: data.invoicePrefix }),
    },
  });

  await logStatusChange({
    entity: 'Business',
    entityId: businessId,
    action: 'UPDATE',
    oldValue: JSON.stringify({ name: business.name }),
    newValue: JSON.stringify({ name: updated.name }),
    description: 'Business updated',
    changedBy: userId,
  });

  return updated;
}

export async function deleteBusiness(businessId: string, userId: string) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId, deletedAt: null },
  });

  if (!business) {
    throw new AppError('Business not found', 404);
  }

  await prisma.business.update({
    where: { id: businessId },
    data: { deletedAt: new Date() },
  });

  await logStatusChange({
    entity: 'Business',
    entityId: businessId,
    action: 'DELETE',
    oldValue: 'Active',
    newValue: 'Deleted',
    description: `Business "${business.name}" deleted`,
    changedBy: userId,
  });

  return { message: 'Business deleted successfully' };
}

export async function getBusinessStats(businessId: string, userId: string) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId, deletedAt: null },
  });

  if (!business) {
    throw new AppError('Business not found', 404);
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalClients,
    totalInvoices,
    monthlyInvoices,
    totalRevenue,
    monthlyRevenue,
    pendingInvoices,
    overdueInvoices,
  ] = await Promise.all([
    prisma.client.count({ where: { businessId, deletedAt: null } }),
    prisma.invoice.count({ where: { businessId, deletedAt: null } }),
    prisma.invoice.count({
      where: { businessId, deletedAt: null, createdAt: { gte: startOfMonth } },
    }),
    prisma.invoice.aggregate({
      where: { businessId, deletedAt: null, status: 'Paid' },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: {
        businessId,
        deletedAt: null,
        status: 'Paid',
        createdAt: { gte: startOfMonth },
      },
      _sum: { total: true },
    }),
    prisma.invoice.count({
      where: { businessId, deletedAt: null, status: { in: ['Sent', 'Viewed'] } },
    }),
    prisma.invoice.count({
      where: { businessId, deletedAt: null, status: 'Overdue' },
    }),
  ]);

  return {
    totalClients,
    totalInvoices,
    monthlyInvoices,
    totalRevenue: totalRevenue._sum.total || 0,
    monthlyRevenue: monthlyRevenue._sum.total || 0,
    pendingInvoices,
    overdueInvoices,
  };
}
