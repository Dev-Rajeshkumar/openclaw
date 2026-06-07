import { Response, NextFunction } from 'express';
import * as statusLogService from '../services/statusLog.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

export const getEntityLogs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { entity, entityId } = req.params;
    const logs = await statusLogService.getStatusLogs(entity, entityId);
    res.status(200).json(ApiResponse.success(logs));
  } catch (error) {
    next(error);
  }
};

export const getMyLogs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await statusLogService.getStatusLogsByUser(userId, page, limit);
    res.status(200).json(ApiResponse.paginated(
      result.logs,
      result.page,
      result.limit,
      result.total
    ));
  } catch (error) {
    next(error);
  }
};
