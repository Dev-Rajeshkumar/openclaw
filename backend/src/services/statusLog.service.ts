import prisma from '../prisma/index.js';

interface StatusLogInput {
  entity: string;
  entityId: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
  changedBy: string;
  metadata?: Record<string, unknown>;
}

export async function logStatusChange(data: StatusLogInput): Promise<void> {
  try {
    await prisma.statusLog.create({
      data: {
        entity: data.entity,
        entityId: data.entityId,
        action: data.action,
        oldValue: data.oldValue,
        newValue: data.newValue,
        description: data.description,
        changedBy: data.changedBy,
        metadata: data.metadata as any,
      },
    });
  } catch (error) {
    console.error('[StatusLog] Failed to create log:', error);
  }
}

export async function getStatusLogs(
  entity: string,
  entityId: string
) {
  return prisma.statusLog.findMany({
    where: { entity, entityId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function getStatusLogsByUser(
  userId: string,
  page: number = 1,
  limit: number = 50
) {
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.statusLog.findMany({
      where: { changedBy: userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.statusLog.count({ where: { changedBy: userId } }),
  ]);

  return { logs, total, page, limit };
}
