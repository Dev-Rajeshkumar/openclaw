import { Response, NextFunction } from 'express';
import * as expenseService from '../services/expense.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

export const create = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { businessId } = req.params;
    const expense = await expenseService.createExpense(userId, businessId, req.body);
    res.status(201).json(ApiResponse.created(expense, 'Expense recorded successfully'));
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
    const category = req.query.category as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const result = await expenseService.getExpenses(
      userId,
      businessId,
      page,
      limit,
      category,
      startDate,
      endDate
    );
    res.status(200).json(ApiResponse.paginated(
      result.expenses,
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
    const expense = await expenseService.getExpenseById(id, userId);
    res.status(200).json(ApiResponse.success(expense));
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
    const expense = await expenseService.updateExpense(id, userId, req.body);
    res.status(200).json(ApiResponse.success(expense, 'Expense updated successfully'));
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
    const result = await expenseService.deleteExpense(id, userId);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

export const getStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { businessId } = req.params;
    const stats = await expenseService.getExpenseStats(userId, businessId);
    res.status(200).json(ApiResponse.success(stats));
  } catch (error) {
    next(error);
  }
};
