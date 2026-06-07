import { Response, NextFunction } from 'express';
import * as paymentService from '../services/payment.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

export const create = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { invoiceId } = req.params;
    const payment = await paymentService.createPayment(userId, invoiceId, req.body);
    res.status(201).json(ApiResponse.created(payment, 'Payment recorded successfully'));
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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const invoiceId = req.query.invoiceId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const result = await paymentService.getPayments(
      userId,
      page,
      limit,
      invoiceId,
      startDate,
      endDate
    );
    res.status(200).json(ApiResponse.paginated(
      result.payments,
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
    const payment = await paymentService.getPaymentById(id, userId);
    res.status(200).json(ApiResponse.success(payment));
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
    const result = await paymentService.deletePayment(id, userId);
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
    const businessId = req.query.businessId as string;
    const stats = await paymentService.getPaymentStats(userId, businessId);
    res.status(200).json(ApiResponse.success(stats));
  } catch (error) {
    next(error);
  }
};
