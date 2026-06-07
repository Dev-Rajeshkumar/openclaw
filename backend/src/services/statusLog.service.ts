import { PrismaClient } from '@prisma/client';
import { IStatusLog } from '../types/index.js';

const prisma = new PrismaClient();

export class StatusLogService {
  /**
   * Log a status change (user-facing audit trail)
   */
  async log(data: {
    entity: string;
    entityId: string;
    action: string;
    oldValue?: string;
    newValue?: string;
    description?: string;
    changedBy: string;
    metadata?: Record<string, unknown>;
  }): Promise<IStatusLog> {
    const log = await prisma.statusLog.create({
      data: {
        entity: data.entity,
        entityId: data.entityId,
        action: data.action,
        oldValue: data.oldValue || null,
        newValue: data.newValue || null,
        description: data.description || null,
        changedBy: data.changedBy,
        metadata: (data.metadata || null) as any,
      },
    });

    return log as unknown as IStatusLog;
  }

  /**
   * Get status logs for a specific entity
   */
  async getByEntity(entity: string, entityId: string) {
    return prisma.statusLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' },
      include: {
        changer: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  /**
   * Get status logs for an invoice (convenience method)
   */
  async getByInvoice(invoiceId: string) {
    return this.getByEntity('Invoice', invoiceId);
  }

  /**
   * Get status logs for a client (convenience method)
   */
  async getByClient(clientId: string) {
    return this.getByEntity('Client', clientId);
  }

  /**
   * Get status logs for a business (convenience method)
   */
  async getByBusiness(businessId: string) {
    return this.getByEntity('Business', businessId);
  }

  /**
   * Get all status logs for a user's business
   */
  async getByUser(userId: string, options?: {
    page?: number;
    limit?: number;
    entity?: string;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = { changedBy: userId };
    if (options?.entity) where.entity = options.entity;

    const [logs, total] = await Promise.all([
      prisma.statusLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.statusLog.count({ where }),
    ]);

    return { logs, total, page, limit };
  }
}

export const statusLogService = new StatusLogService();
