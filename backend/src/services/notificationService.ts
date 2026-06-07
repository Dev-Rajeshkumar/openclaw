import prisma from '../prisma/index.js';
import { NotificationType } from '../types/index.js';

export async function createNotification(
  userId: string,
  data: {
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
  }
) {
  return prisma.notification.create({
    data: {
      userId,
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link,
    },
  });
}

export async function getNotifications(
  userId: string,
  page: number = 1,
  limit: number = 20,
  unreadOnly: boolean = false
) {
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (unreadOnly) where.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return { notifications, total, unreadCount, page, limit };
}

export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return { message: 'All notifications marked as read' };
}

export async function deleteNotification(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });

  return { message: 'Notification deleted' };
}

// Helper to create common notification types
export async function notifyInvoiceSent(
  userId: string,
  invoiceNumber: string,
  link?: string
) {
  return createNotification(userId, {
    title: 'Invoice Sent',
    message: `Invoice ${invoiceNumber} has been sent to the client.`,
    type: NotificationType.Invoice,
    link,
  });
}

export async function notifyPaymentReceived(
  userId: string,
  invoiceNumber: string,
  amount: number,
  link?: string
) {
  return createNotification(userId, {
    title: 'Payment Received',
    message: `Payment of INR ${amount} received for invoice ${invoiceNumber}.`,
    type: NotificationType.Payment,
    link,
  });
}

export async function notifyInvoiceOverdue(
  userId: string,
  invoiceNumber: string,
  link?: string
) {
  return createNotification(userId, {
    title: 'Invoice Overdue',
    message: `Invoice ${invoiceNumber} is now overdue.`,
    type: NotificationType.Reminder,
    link,
  });
}
