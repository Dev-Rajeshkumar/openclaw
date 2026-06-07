import { Response, NextFunction } from 'express';
import * as notificationService from '../services/notificationService.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

export const getAll = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const result = await notificationService.getNotifications(
      userId,
      page,
      limit,
      unreadOnly
    );
    res.status(200).json({
      ...ApiResponse.paginated(
        result.notifications,
        result.page,
        result.limit,
        result.total
      ),
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const notification = await notificationService.markAsRead(id, userId);
    res.status(200).json(ApiResponse.success(notification, 'Notification marked as read'));
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const result = await notificationService.markAllAsRead(userId);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

export const remove = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const result = await notificationService.deleteNotification(id, userId);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};
