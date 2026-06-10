/**
 * GDPR compliance service.
 * Provides data export (right to portability) and account deletion (right to erasure).
 */

import prisma from '../prisma/index.js';
import { AppError } from '../utils/response.js';
import type { ExportedUserData, SafeUserData } from '../types/gdpr.js';

/** Fields to strip from user data before export. */
const SENSITIVE_USER_FIELDS = ['password', 'googleId'] as const;

/** Export all user data in a portable JSON format. */
export async function exportUserData(userId: string): Promise<ExportedUserData> {
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    include: {
      businesses: { where: { deletedAt: null } },
      clients: { where: { deletedAt: null } },
      invoices: { where: { deletedAt: null } },
      estimates: { where: { deletedAt: null } },
      recurringInvoices: { where: { deletedAt: null } },
      payments: { where: { deletedAt: null } },
      expenses: { where: { deletedAt: null } },
      products: { where: { deletedAt: null } },
      services: { where: { deletedAt: null } },
      files: { where: { deletedAt: null } },
      notifications: true,
      activityLogs: true,
      statusLogs: true,
      teamMemberships: { where: { deletedAt: null } },
      apiKeys: { where: { deletedAt: null } },
      notificationPreference: true,
      subscription: true,
    },
  });

  if (!user) throw new AppError('User not found', 404);

  // Remove sensitive internal fields
  const safeUser = { ...user } as Record<string, unknown>;
  for (const field of SENSITIVE_USER_FIELDS) {
    delete safeUser[field];
  }

  return {
    exportDate: new Date().toISOString(),
    format: 'BillingBee GDPR Export v1',
    user: safeUser as SafeUserData,
  };
}

/**
 * Delete user account and all associated data (right to erasure).
 * This is a hard delete — all data is permanently removed.
 */
export async function deleteUserAccount(userId: string): Promise<{ deleted: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
  });
  if (!user) throw new AppError('User not found', 404);

  await prisma.$transaction(async (tx) => {
    await tx.refreshToken.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.activityLog.deleteMany({ where: { userId } });
    await tx.statusLog.deleteMany({ where: { changedBy: userId } });
    await tx.teamMember.deleteMany({ where: { userId } });
    await tx.invitation.deleteMany({ where: { invitedBy: userId } });
    await tx.apiKey.deleteMany({ where: { userId } });
    await tx.notificationPreference.deleteMany({ where: { userId } });
    await tx.subscription.deleteMany({ where: { userId } });
    await tx.payment.deleteMany({ where: { userId } });
    await tx.expense.deleteMany({ where: { userId } });
    await tx.file.deleteMany({ where: { userId } });
    await tx.invoice.deleteMany({ where: { userId } });
    await tx.estimate.deleteMany({ where: { userId } });
    await tx.recurringInvoice.deleteMany({ where: { userId } });
    await tx.client.deleteMany({ where: { userId } });
    await tx.product.deleteMany({ where: { userId } });
    await tx.service.deleteMany({ where: { userId } });
    await tx.business.deleteMany({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });
  });

  return { deleted: true };
}
