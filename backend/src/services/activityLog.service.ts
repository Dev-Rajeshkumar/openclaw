import prisma from '../prisma/index.js';

interface ActivityLogInput {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  method: string;
  path: string;
  statusCode?: number;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(data: ActivityLogInput): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        method: data.method,
        path: data.path,
        statusCode: data.statusCode,
        ip: data.ip,
        userAgent: data.userAgent,
        metadata: data.metadata as any,
      },
    });
  } catch (error) {
    console.error('[ActivityLog] Failed to create log:', error);
  }
}

export async function getActivityLogs(
  userId: string,
  page: number = 1,
  limit: number = 50
) {
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where: { userId } }),
  ]);

  return { logs, total, page, limit };
}

export async function getActivityLogsByEntity(
  entity: string,
  entityId: string
) {
  return prisma.activityLog.findMany({
    where: { entity, entityId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}
