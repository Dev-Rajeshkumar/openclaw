import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import { canCreateClient } from '../utils/planLimits.js';
import { statusLogService } from './statusLog.service.js';
import { CreateClientInput, UpdateClientInput, ListClientsQuery } from '../validators/client.validator.js';
import { SubscriptionPlan } from '../types/index.js';

const prisma = new PrismaClient();

export class ClientService {
  async create(userId: string, businessId: string, plan: SubscriptionPlan, input: CreateClientInput) {
    const clientCount = await prisma.client.count({ where: { businessId, deletedAt: null } });
    if (!canCreateClient(plan, clientCount)) {
      throw new AppError(`Client limit reached for your plan.`, 403);
    }

    const client = await prisma.client.create({
      data: {
        userId,
        businessId,
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        gstNumber: input.gstNumber || null,
        address: input.address || null,
      },
    });

    await statusLogService.log({
      entity: 'Client',
      entityId: client.id,
      action: 'CREATED',
      newValue: 'ACTIVE',
      description: `Client "${client.name}" created`,
      changedBy: userId,
    });

    return client;
  }

  async list(businessId: string, query: ListClientsQuery) {
    const { page, limit, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = { businessId, deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder } }),
      prisma.client.count({ where }),
    ]);

    return { clients, total, page, limit };
  }

  async getById(userId: string, businessId: string, clientId: string) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, businessId, deletedAt: null },
    });
    if (!client) throw new AppError('Client not found', 404);
    return client;
  }

  async update(userId: string, businessId: string, clientId: string, input: UpdateClientInput) {
    const existing = await this.getById(userId, businessId, clientId);

    const client = await prisma.client.update({ where: { id: clientId }, data: input });

    const changedFields = Object.keys(input).filter(
      (k) => (input as Record<string, unknown>)[k] !== undefined &&
        (input as Record<string, unknown>)[k] !== (existing as Record<string, unknown>)[k]
    );

    if (changedFields.length > 0) {
      await statusLogService.log({
        entity: 'Client',
        entityId: clientId,
        action: 'UPDATED',
        oldValue: JSON.stringify(Object.fromEntries(changedFields.map((k) => [k, (existing as Record<string, unknown>)[k]]))),
        newValue: JSON.stringify(Object.fromEntries(changedFields.map((k) => [k, (input as Record<string, unknown>)[k]]))),
        description: `Client "${client.name}" updated: ${changedFields.join(', ')}`,
        changedBy: userId,
        metadata: { changedFields },
      });
    }

    return client;
  }

  async softDelete(userId: string, businessId: string, clientId: string) {
    const client = await this.getById(userId, businessId, clientId);

    // Check for active invoices
    const invoiceCount = await prisma.invoice.count({
      where: { clientId, businessId, deletedAt: null, status: { not: 'CANCELLED' } },
    });
    if (invoiceCount > 0) {
      throw new AppError(`Cannot delete client with ${invoiceCount} active invoice(s).`, 400);
    }

    await prisma.client.update({ where: { id: clientId }, data: { deletedAt: new Date() } });

    await statusLogService.log({
      entity: 'Client',
      entityId: clientId,
      action: 'DELETED',
      oldValue: 'ACTIVE',
      newValue: 'DELETED',
      description: `Client "${client.name}" deleted`,
      changedBy: userId,
    });

    return { message: 'Client deleted successfully' };
  }
}

export const clientService = new ClientService();
