import { Response, NextFunction } from 'express';
import * as estimateService from '../services/estimate.service.js';
import { AuthenticatedRequest, EstimateStatus } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

export const create = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { businessId, clientId } = req.params;
    const estimate = await estimateService.createEstimate(
      userId,
      businessId,
      clientId,
      req.body
    );
    res.status(201).json(ApiResponse.created(estimate, 'Estimate created successfully'));
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
    const status = req.query.status as string;
    const clientId = req.query.clientId as string;

    const result = await estimateService.getEstimates(
      userId,
      businessId,
      page,
      limit,
      status,
      clientId
    );
    res.status(200).json(ApiResponse.paginated(
      result.estimates,
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
    const estimate = await estimateService.getEstimateById(id, userId);
    res.status(200).json(ApiResponse.success(estimate));
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
    const estimate = await estimateService.updateEstimate(id, userId, req.body);
    res.status(200).json(ApiResponse.success(estimate, 'Estimate updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { status } = req.body;
    const estimate = await estimateService.updateEstimateStatus(
      id,
      userId,
      status as EstimateStatus
    );
    res.status(200).json(ApiResponse.success(estimate, 'Estimate status updated'));
  } catch (error) {
    next(error);
  }
};

export const convertToInvoice = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { businessId } = req.body;
    const invoice = await estimateService.convertToInvoice(id, userId, businessId);
    res.status(201).json(ApiResponse.created(invoice, 'Estimate converted to invoice'));
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
    const result = await estimateService.deleteEstimate(id, userId);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};
