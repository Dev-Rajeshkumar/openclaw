import { PrismaClient } from '@prisma/client';
import { omit } from 'lodash';
import { AppError } from '../middleware/errorHandler.js';
import { canCreateClient } from '../utils/planLimits.js';
import { CreateClientInput, UpdateClientInput, ListClientsQuery } from '../validators/client.validator.js';
import { SubscriptionPlan } from '../types/index.js';

const prisma = new PrismaClient();

export class ClientService {
  /**
   * Create a new client
   */
  async create(userId: string, plan: SubscriptionPlan, input: CreateClientInput) {
    // Check plan limits
    const clientCount = await prisma.client.count({ where: { userId });
    if (!canCreateClient(plan, clientCount)) {
      throw new AppError(
        `Client limit reached for your plan. Upgrade to add more clients.`,
        403
      );
    }

    const client = await prisma.client.create({
      data: {
        userId,
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        gstNumber: input.gstNumber || null,
        address: input.address || null,
      },
    });

    return client;
  }

  /**
   * Get all clients for a user with pagination
   */
  async list(userId: string, query: ListClientsQuery) {
    const { page, limit, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.client.count({ where }),
    ]);

    return { clients, total, page, limit };
  }

  /**
   * Get a single client by ID
   */
  async getById(userId: string, clientId: string) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId },
    });

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    return client;
  }

  /**
   * Update a client
   */
  async update(userId: string, clientId: string, input: UpdateClientInput) {
    // Verify ownership
    await this.getById(userId, clientId);

    const updateData = omit(input, ['id']);
    const client = await prisma.client.update({
      where: { id: clientId },
      data: updateData,
    });

    return client;
  }

  /**
   * Delete a client
   */
  async delete(userId: string, clientId: string) {
    // Verify ownership
    await this.getById(userId, clientId);

    // Check if client has invoices
    const invoiceCount = await prisma.invoice.count({
      where: { clientId, userId },
    });

    if (invoiceCount > 0) {
      throw new AppError(
        'Cannot delete client with existing invoices. Please delete invoices first.',
        400
      );
    }

    await prisma.client.delete({ where: { id: clientId } });
    return { message: 'Client deleted successfully' };
  }
}

export const clientService = new ClientService();
