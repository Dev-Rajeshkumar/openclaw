import prisma from '../prisma/index.js';
import { AppError } from '../utils/response.js';
import { logStatusChange } from './statusLog.service.js';
import { Plan, SubscriptionStatus } from '../types/index.js';
import { notifySubscriptionChange } from './notification.service.js';

export async function getSubscription(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: { user: { select: { email: true, plan: true } } },
  });

  if (!subscription) {
    throw new AppError('Subscription not found', 404);
  }

  return subscription;
}

export async function createSubscription(
  userId: string,
  plan: Plan
) {
  const existing = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (existing) {
    throw new AppError('Subscription already exists', 409);
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      plan,
      status: SubscriptionStatus.Active,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });

  // Update user plan
  await prisma.user.update({
    where: { id: userId },
    data: { plan },
  });

  return subscription;
}

export async function updateSubscription(
  userId: string,
  data: {
    plan?: Plan;
    status?: SubscriptionStatus;
    cancelAtPeriodEnd?: boolean;
    paymentMethod?: string;
  }
) {
  const oldSub = await prisma.subscription.findUnique({
    where: { userId },
    include: { user: { select: { email: true, plan: true } } },
  });

  if (!oldSub) {
    throw new AppError('Subscription not found', 404);
  }

  const subscription = await prisma.subscription.update({
    where: { userId },
    data: {
      ...(data.plan && { plan: data.plan }),
      ...(data.status && { status: data.status }),
      ...(data.cancelAtPeriodEnd !== undefined && {
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      }),
      ...(data.paymentMethod !== undefined && {
        paymentMethod: data.paymentMethod,
      }),
    },
  });

  // Sync user plan if changed
  if (data.plan && data.plan !== oldSub.plan) {
    await prisma.user.update({
      where: { id: userId },
      data: { plan: data.plan },
    });

    notifySubscriptionChange(
      oldSub.user.email,
      oldSub.plan,
      data.plan
    ).catch(() => {});

    await logStatusChange({
      entity: 'Subscription',
      entityId: subscription.id,
      action: 'PLAN_CHANGE',
      oldValue: oldSub.plan,
      newValue: data.plan,
      description: `Subscription plan changed from ${oldSub.plan} to ${data.plan}`,
      changedBy: userId,
    });
  }

  return subscription;
}

export async function cancelSubscription(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    throw new AppError('Subscription not found', 404);
  }

  const updated = await prisma.subscription.update({
    where: { userId },
    data: {
      cancelAtPeriodEnd: true,
      status: SubscriptionStatus.Cancelled,
    },
  });

  await logStatusChange({
    entity: 'Subscription',
    entityId: subscription.id,
    action: 'CANCEL',
    oldValue: subscription.status,
    newValue: SubscriptionStatus.Cancelled,
    description: 'Subscription cancelled',
    changedBy: userId,
  });

  return updated;
}

export async function renewSubscription(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    throw new AppError('Subscription not found', 404);
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const updated = await prisma.subscription.update({
    where: { userId },
    data: {
      status: SubscriptionStatus.Active,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
  });

  return updated;
}

/**
 * Check and update expired subscriptions
 * Should be run periodically (e.g., via cron)
 */
export async function checkExpiredSubscriptions() {
  const expired = await prisma.subscription.findMany({
    where: {
      status: SubscriptionStatus.Active,
      currentPeriodEnd: { lt: new Date() },
      cancelAtPeriodEnd: false,
    },
  });

  for (const sub of expired) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: SubscriptionStatus.PastDue },
    });
  }

  return expired.length;
}
