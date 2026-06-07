import prisma from '../prisma/index.js';
import { AppError } from '../utils/response.js';
import { logStatusChange } from './statusLog.service.js';

export async function uploadFile(
  userId: string,
  businessId: string,
  data: {
    entityType: string;
    entityId: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    size: number;
  }
) {
  const file = await prisma.file.create({
    data: {
      userId,
      businessId,
      entityType: data.entityType,
      entityId: data.entityId,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      mimeType: data.mimeType,
      size: data.size,
      uploadedBy: userId,
    },
  });

  await logStatusChange({
    entity: 'File',
    entityId: file.id,
    action: 'UPLOAD',
    description: `File "${data.fileName}" uploaded for ${data.entityType}:${data.entityId}`,
    changedBy: userId,
  });

  return file;
}

export async function getFiles(
  userId: string,
  businessId: string,
  entityType?: string,
  entityId?: string
) {
  const where: any = {
    userId,
    businessId,
    deletedAt: null,
  };

  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;

  return prisma.file.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getFileById(fileId: string, userId: string) {
  const file = await prisma.file.findFirst({
    where: { id: fileId, userId, deletedAt: null },
  });

  if (!file) {
    throw new AppError('File not found', 404);
  }

  return file;
}

export async function deleteFile(fileId: string, userId: string) {
  const file = await prisma.file.findFirst({
    where: { id: fileId, userId, deletedAt: null },
  });

  if (!file) {
    throw new AppError('File not found', 404);
  }

  await prisma.file.update({
    where: { id: fileId },
    data: { deletedAt: new Date() },
  });

  await logStatusChange({
    entity: 'File',
    entityId: fileId,
    action: 'DELETE',
    description: `File "${file.fileName}" deleted`,
    changedBy: userId,
  });

  return { message: 'File deleted successfully' };
}
