import { Response, NextFunction } from 'express';
import prisma from '../prisma/index.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

const DEFAULT_PREFERENCES = {
  emailInvoice: true,
  emailPayment: true,
  emailReminder: true,
  emailTeam: true,
  pushInvoice: true,
  pushPayment: true,
  pushReminder: true,
  pushTeam: true,
};

export const get = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;

    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      res.status(200).json(ApiResponse.success(DEFAULT_PREFERENCES));
      return;
    }

    res.status(200).json(
      ApiResponse.success({
        emailInvoice: prefs.emailInvoice,
        emailPayment: prefs.emailPayment,
        emailReminder: prefs.emailReminder,
        emailTeam: prefs.emailTeam,
        pushInvoice: prefs.pushInvoice,
        pushPayment: prefs.pushPayment,
        pushReminder: prefs.pushReminder,
        pushTeam: prefs.pushTeam,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const update = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const {
      emailInvoice,
      emailPayment,
      emailReminder,
      emailTeam,
      pushInvoice,
      pushPayment,
      pushReminder,
      pushTeam,
    } = req.body;

    const data: Record<string, boolean> = {};
    if (typeof emailInvoice === 'boolean') data.emailInvoice = emailInvoice;
    if (typeof emailPayment === 'boolean') data.emailPayment = emailPayment;
    if (typeof emailReminder === 'boolean') data.emailReminder = emailReminder;
    if (typeof emailTeam === 'boolean') data.emailTeam = emailTeam;
    if (typeof pushInvoice === 'boolean') data.pushInvoice = pushInvoice;
    if (typeof pushPayment === 'boolean') data.pushPayment = pushPayment;
    if (typeof pushReminder === 'boolean') data.pushReminder = pushReminder;
    if (typeof pushTeam === 'boolean') data.pushTeam = pushTeam;

    const prefs = await prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    res.status(200).json(
      ApiResponse.success({
        emailInvoice: prefs.emailInvoice,
        emailPayment: prefs.emailPayment,
        emailReminder: prefs.emailReminder,
        emailTeam: prefs.emailTeam,
        pushInvoice: prefs.pushInvoice,
        pushPayment: prefs.pushPayment,
        pushReminder: prefs.pushReminder,
        pushTeam: prefs.pushTeam,
      }, 'Notification preferences updated')
    );
  } catch (error) {
    next(error);
  }
};
