import { Response, NextFunction } from 'express';
import * as subscriptionService from '../services/subscription.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

export const getSubscription = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const subscription = await subscriptionService.getSubscription(userId);
    res.status(200).json(ApiResponse.success(subscription));
  } catch (error) {
    next(error);
  }
};

export const create = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { plan } = req.body;
    const subscription = await subscriptionService.createSubscription(userId, plan);
    res.status(201).json(ApiResponse.created(subscription, 'Subscription created'));
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
    const subscription = await subscriptionService.updateSubscription(userId, req.body);
    res.status(200).json(ApiResponse.success(subscription, 'Subscription updated'));
  } catch (error) {
    next(error);
  }
};

export const cancel = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const subscription = await subscriptionService.cancelSubscription(userId);
    res.status(200).json(ApiResponse.success(subscription, 'Subscription cancelled'));
  } catch (error) {
    next(error);
  }
};

export const renew = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const subscription = await subscriptionService.renewSubscription(userId);
    res.status(200).json(ApiResponse.success(subscription, 'Subscription renewed'));
  } catch (error) {
    next(error);
  }
};
