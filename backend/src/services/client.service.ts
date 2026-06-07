import prisma from '../prisma/index.js';
import { AppError } from '../utils/response.js';
import { logStatusChange } from './statusLog.service.js';
import { ClientStatus, TeamRole } from '../types/index.js';

export async function createClient(
  userId: string,
  businessId: string,
  data: {
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    gstNumber?: string;
    pan?: string;
    billingAddress?: string;
    shippingAddress?: string;
    notes?: string;
    tags?: string[];
    status?: ClientStatus;
  }
) {
  const client = await prisma.client.create({
    data: {
      userId,
      businessId,
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      gstNumber: data.gstNumber,
      pan: data.pan,
      billingAddress: data.billingAddress,
      shippingAddress: data.shippingAddress,
      notes: data.notes,
      tags: data.tags || [],
      status: data.status || ClientStatus.Active,
      createdBy: userId,
    },
  });

  await logStatusChange({
    entity: 'Client',
    entityId: client.id,
    action: 'CREATE',
    newValue: client.status,
    description: `Client "${data.name}" created`,
    changedBy: userId,
  });

  return client;
}

export async function getClients(
  userId: string,
  businessId: string,
  page: number = 1,
  limit: number = 20,
  search?: string,
  status?: string
) {
  const skip = (page - 1) * limit;

  const where: any = {
    userId,
    businessId,
    deletedAt: null,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.client.count({ where }),
  ]);

  return { clients, total, page, limit };
}

export async function getClientById(clientId: string, userId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId, deletedAt: null },
    include: {
      _count: {
        select: {
          invoices: { where: { deletedAt: null } },
          estimates: { where: { deletedAt: null } },
        },
      },
    },
  });

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  return client;
}

export async function updateClient(
  clientId: string,
  userId: string,
  data: {
    name?: string;
    company?: string;
    email?: string;
    phone?: string;
    gstNumber?: string;
    pan?: string;
    billingAddress?: string;
    shippingAddress?: string;
    notes?: string;
    tags?: string[];
    status?: ClientStatus;
  }
) {
  const oldClient = await prisma.client.findFirst({
    where: { id: clientId, userId, deletedAt: null },
  });

  if (!oldClient) {
    throw new AppError('Client not found', 404);
  }

  const client = await prisma.client.update({
    where: { id: clientId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.company !== undefined && { company: data.company }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.gstNumber !== undefined && { gstNumber: data.gstNumber }),
      ...(data.pan !== undefined && { pan: data.pan }),
      ...(data.billingAddress !== undefined && { billingAddress: data.billingAddress }),
      ...(data.shippingAddress !== undefined && { shippingAddress: data.shippingAddress }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.status && { status: data.status }),
    },
  });

  await logStatusChange({
    entity: 'Client',
    entityId: clientId,
    action: 'UPDATE',
    oldValue: oldClient.status,
    newValue: client.status,
    description: `Client "${data.name || oldClient.name}" updated`,
    changedBy: userId,
  });

  return client;
}

export async function deleteClient(clientId: string, userId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId, deletedAt: null },
  });

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  await prisma.client.update({
    where: { id: clientId },
    data: { deletedAt: new Date() },
  });

  await logStatusChange({
    entity: 'Client',
    entityId: clientId,
    action: 'DELETE',
    oldValue: client.status,
    newValue: 'Deleted',
    description: `Client "${client.name}" deleted`,
    changedBy: userId,
  });

  return { message: 'Client deleted successfully' };
}
