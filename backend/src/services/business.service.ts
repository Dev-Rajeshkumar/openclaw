import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import { IBusiness, SubscriptionPlan } from '../types/index.js';
import { statusLogService } from './statusLog.service.js';

const prisma = new PrismaClient();

export class BusinessService {
  /**
   * Create a new business for a user
   */
  async create(userId: string, data: {
    name: string;
    gstNumber?: string;
    phone?: string;
    address?: string;
    logo?: string;
    invoicePrefix?: string;
  }) {
    const business = await prisma.business.create({
      data: {
        userId,
        name: data.name,
        gstNumber: data.gstNumber || null,
        phone: data.phone || null,
        address: data.address || null,
        logo: data.logo || null,
        invoicePrefix: data.invoicePrefix || 'BB',
        plan: SubscriptionPlan.FREE,
      },
    });

    // Log status
    await statusLogService.log({
      entity: 'Business',
      entityId: business.id,
      action: 'CREATED',
      newValue: 'ACTIVE',
      description: `Business "${business.name}" created`,
      changedBy: userId,
    });

    return business;
  }

  /**
   * Get all businesses for a user (excluding soft-deleted)
   */
  async getByUser(userId: string) {
    return prisma.business.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single business by ID (verifying ownership)
   */
  async getById(userId: string, businessId: string) {
    const business = await prisma.business.findFirst({
      where: { id: businessId, userId, deletedAt: null },
    });

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    return business;
  }

  /**
   * Update a business
   */
  async update(userId: string, businessId: string, data: {
    name?: string;
    gstNumber?: string;
    phone?: string;
    address?: string;
    logo?: string;
    invoicePrefix?: string;
  }) {
    const existing = await this.getById(userId, businessId);

    const business = await prisma.business.update({
      where: { id: businessId },
      data,
    });

    // Track changes for status log
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && (existing as Record<string, unknown>)[key] !== value) {
        changes[key] = { old: (existing as Record<string, unknown>)[key], new: value };
      }
    }

    if (Object.keys(changes).length > 0) {
      await statusLogService.log({
        entity: 'Business',
        entityId: businessId,
        action: 'UPDATED',
        oldValue: JSON.stringify(Object.fromEntries(
          Object.entries(changes).map(([k, v]) => [k, v.old])
        )),
        newValue: JSON.stringify(Object.fromEntries(
          Object.entries(changes).map(([k, v]) => [k, v.new])
        )),
        description: `Business updated: ${Object.keys(changes).join(', ')}`,
        changedBy: userId,
        metadata: { changes },
      });
    }

    return business;
  }

  /**
   * Soft delete a business
   */
  async softDelete(userId: string, businessId: string) {
    await this.getById(userId, businessId);

    const business = await prisma.business.update({
      where: { id: businessId },
      data: { deletedAt: new Date() },
    });

    await statusLogService.log({
      entity: 'Business',
      entityId: businessId,
      action: 'DELETED',
      oldValue: 'ACTIVE',
      newValue: 'DELETED',
      description: `Business "${business.name}" deleted`,
      changedBy: userId,
    });

    return { message: 'Business deleted successfully' };
  }

  /**
   * Update business plan
   */
  async updatePlan(userId: string, businessId: string, plan: SubscriptionPlan) {
    const existing = await this.getById(userId, businessId);

    const business = await prisma.business.update({
      where: { id: businessId },
      data: { plan },
    });

    await statusLogService.log({
      entity: 'Business',
      entityId: businessId,
      action: 'PLAN_CHANGED',
      oldValue: existing.plan,
      newValue: plan,
      description: `Plan changed from ${existing.plan} to ${plan}`,
      changedBy: userId,
    });

    return business;
  }

  /**
   * Get the default (first) business for a user
   */
  async getDefault(userId: string) {
    const business = await prisma.business.findFirst({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    if (!business) {
      throw new AppError('No business found. Please create one.', 404);
    }

    return business;
  }
}

export const businessService = new BusinessService();
