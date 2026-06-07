import { PrismaClient } from '@prisma/client';
import { IActivityLog } from '../types/index.js';
import { omit } from 'lodash';

const prisma = new PrismaClient();

// Fields to sanitize from request body (never log sensitive data)
const SENSITIVE_FIELDS = ['password', 'confirmPassword', 'currentPassword', 'token', 'refreshToken', 'secret', 'creditCard', 'cardNumber', 'cvv'];

export class ActivityLogService {
  /**
   * Log an activity (internal reference — every action/endpoint)
   */
  async log(data: {
    userId: string;
    action: string;
    entity: string;
    entityId?: string;
    method: string;
    path: string;
    statusCode?: number;
    ip?: string;
    userAgent?: string;
    requestBody?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<IActivityLog> {
    // Sanitize sensitive fields from request body
    const sanitizedBody = data.requestBody
      ? this.sanitizeBody(data.requestBody)
      : null;

    const log = await prisma.activityLog.create({
      data: {
        userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId || null,
        method: data.method,
        path: data.path,
        statusCode: data.statusCode || null,
        ip: data.ip || null,
        userAgent: data.userAgent || null,
        requestBody: sanitizedBody as any,
        metadata: (data.metadata || null) as any,
      },
    });

    return log as unknown as IActivityLog;
  }

  /**
   * Get activity logs for a user
   */
  async getByUser(userId: string, options?: {
    page?: number;
    limit?: number;
    action?: string;
    entity?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = { userId };

    if (options?.action) where.action = options.action;
    if (options?.entity) where.entity = options.entity;
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return { logs, total, page, limit };
  }

  /**
   * Get all activity logs (admin/debug)
   */
  async getAll(options?: {
    page?: number;
    limit?: number;
    action?: string;
    entity?: string;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 100;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};
    if (options?.action) where.action = options.action;
    if (options?.entity) where.entity = options.entity;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, fullName: true } },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return { logs, total, page, limit };
  }

  /**
   * Remove sensitive fields from request body before logging
   */
  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (SENSITIVE_FIELDS.includes(key)) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeBody(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}

export const activityLogService = new ActivityLogService();
