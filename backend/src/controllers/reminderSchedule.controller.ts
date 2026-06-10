import { Response, NextFunction } from 'express';
import prisma from '../prisma/index.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse, AppError } from '../utils/response.js';

/** Get the reminder schedule for a business. */
export const getSchedule = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { businessId } = req.params;

    const business = await prisma.business.findFirst({
      where: { id: businessId, userId, deletedAt: null },
    });
    if (!business) throw new AppError('Business not found', 404);

    const schedule = await prisma.reminderSchedule.findFirst({
      where: { businessId },
    });

    // Return default if not configured yet
    res.status(200).json(ApiResponse.success(schedule || {
      businessId,
      name: 'Default',
      daysBefore: 3,
      onDueDate: true,
      daysAfter: [3, 7, 14, 30],
      emailEnabled: true,
      whatsappEnabled: false,
    }));
  } catch (error) {
    next(error);
  }
};

/** Update the reminder schedule for a business. */
export const updateSchedule = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { businessId } = req.params;
    const { daysBefore, onDueDate, daysAfter, emailEnabled, whatsappEnabled, name } = req.body;

    const business = await prisma.business.findFirst({
      where: { id: businessId, userId, deletedAt: null },
    });
    if (!business) throw new AppError('Business not found', 404);

    const existing = await prisma.reminderSchedule.findFirst({
      where: { businessId },
    });

    let schedule;
    if (existing) {
      schedule = await prisma.reminderSchedule.update({
        where: { id: existing.id },
        data: {
          ...(daysBefore !== undefined && { daysBefore }),
          ...(onDueDate !== undefined && { onDueDate }),
          ...(daysAfter !== undefined && { daysAfter }),
          ...(emailEnabled !== undefined && { emailEnabled }),
          ...(whatsappEnabled !== undefined && { whatsappEnabled }),
          ...(name && { name }),
        },
      });
    } else {
      schedule = await prisma.reminderSchedule.create({
        data: {
          businessId,
          name: name || 'Default',
          daysBefore: daysBefore ?? 3,
          onDueDate: onDueDate ?? true,
          daysAfter: daysAfter || [3, 7, 14, 30],
          emailEnabled: emailEnabled ?? true,
          whatsappEnabled: whatsappEnabled ?? false,
        },
      });
    }

    res.status(200).json(ApiResponse.success(schedule, 'Reminder schedule updated'));
  } catch (error) {
    next(error);
  }
};
