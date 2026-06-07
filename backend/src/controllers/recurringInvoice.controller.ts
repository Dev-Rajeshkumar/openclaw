import { Response, NextFunction } from 'express';
import * as recurringService from '../services/recurringInvoice.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

export const create = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { businessId, clientId } = req.params;
    const recurring = await recurringService.createRecurringInvoice(
      userId,
      businessId,
      clientId,
      req.body
    );
    res.status(201).json(ApiResponse.created(recurring, 'Recurring invoice created'));
  } catch (error) {
    next(error);
  }
};

export const getAll = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { businessId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await recurringService.getRecurringInvoices(
      userId,
      businessId,
      page,
      limit
    );
    res.status(200).json(ApiResponse.paginated(
      result.recurrings,
      result.page,
      result.limit,
      result.total
    ));
  } catch (error) {
    next(error);
  }
};

export const getById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const recurring = await recurringService.getRecurringInvoiceById(id, userId);
    res.status(200).json(ApiResponse.success(recurring));
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
    const { id } = req.params;
    const recurring = await recurringService.updateRecurringInvoice(
      id,
      userId,
      req.body
    );
    res.status(200).json(ApiResponse.success(recurring, 'Recurring invoice updated'));
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
    const result = await recurringService.deleteRecurringInvoice(id, userId);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};
