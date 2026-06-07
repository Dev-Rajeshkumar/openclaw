import { Response, NextFunction } from 'express';
import * as businessService from '../services/business.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

export const create = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const business = await businessService.createBusiness(userId, req.body);
    res.status(201).json(ApiResponse.created(business, 'Business created successfully'));
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
    const businesses = await businessService.getBusinesses(userId);
    res.status(200).json(ApiResponse.success(businesses));
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
    const business = await businessService.getBusinessById(id, userId);
    res.status(200).json(ApiResponse.success(business));
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
    const business = await businessService.updateBusiness(id, userId, req.body);
    res.status(200).json(ApiResponse.success(business, 'Business updated successfully'));
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
    const result = await businessService.deleteBusiness(id, userId);
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
    const { id } = req.params;
    const stats = await businessService.getBusinessStats(id, userId);
    res.status(200).json(ApiResponse.success(stats));
  } catch (error) {
    next(error);
  }
};
