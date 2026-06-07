import prisma from '../prisma/index.js';
import bcrypt from 'bcryptjs';
import { AppError } from '../utils/response.js';
import { Plan } from '../types/index.js';
import { logStatusChange } from './statusLog.service.js';

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    include: {
      subscription: true,
      _count: {
        select: {
          businesses: { where: { deletedAt: null } },
          clients: { where: { deletedAt: null } },
          invoices: { where: { deletedAt: null } },
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}

export async function updateProfile(
  userId: string,
  data: {
    fullName?: string;
    phone?: string;
    avatar?: string;
    currency?: string;
    language?: string;
    timezone?: string;
  }
) {
  const oldUser = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
  });

  if (!oldUser) {
    throw new AppError('User not found', 404);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.fullName && { fullName: data.fullName }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.avatar !== undefined && { avatar: data.avatar }),
      ...(data.currency && { currency: data.currency }),
      ...(data.language && { language: data.language }),
      ...(data.timezone && { timezone: data.timezone }),
    },
  });

  await logStatusChange({
    entity: 'User',
    entityId: userId,
    action: 'UPDATE_PROFILE',
    oldValue: JSON.stringify({ fullName: oldUser.fullName, phone: oldUser.phone }),
    newValue: JSON.stringify({ fullName: user.fullName, phone: user.phone }),
    description: 'Profile updated',
    changedBy: userId,
  });

  return user;
}

export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
  });

  if (!user || !user.password) {
    throw new AppError('User not found or uses OAuth', 404);
  }

  const isValid = await bcrypt.compare(oldPassword, user.password);
  if (!isValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  await logStatusChange({
    entity: 'User',
    entityId: userId,
    action: 'CHANGE_PASSWORD',
    description: 'Password changed',
    changedBy: userId,
  });

  return { message: 'Password changed successfully' };
}

export async function deleteAccount(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() },
  });

  // Soft-delete all businesses
  await prisma.business.updateMany({
    where: { userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  await logStatusChange({
    entity: 'User',
    entityId: userId,
    action: 'DELETE_ACCOUNT',
    oldValue: 'Active',
    newValue: 'Deleted',
    description: 'Account deleted',
    changedBy: userId,
  });

  return { message: 'Account deleted successfully' };
}

export async function upgradePlan(userId: string, newPlan: Plan) {
  const oldUser = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
  });

  if (!oldUser) {
    throw new AppError('User not found', 404);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { plan: newPlan },
  });

  await prisma.subscription.update({
    where: { userId },
    data: { plan: newPlan },
  });

  await logStatusChange({
    entity: 'User',
    entityId: userId,
    action: 'UPGRADE_PLAN',
    oldValue: oldUser.plan,
    newValue: newPlan,
    description: `Plan upgraded from ${oldUser.plan} to ${newPlan}`,
    changedBy: userId,
  });

  return user;
}
