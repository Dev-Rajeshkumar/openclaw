import { Response, NextFunction } from 'express';
import * as userService from '../services/user.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const user = await userService.getProfile(userId);
    res.status(200).json(ApiResponse.success(user));
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const user = await userService.updateProfile(userId, req.body);
    res.status(200).json(ApiResponse.success(user, 'Profile updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { oldPassword, newPassword } = req.body;
    const result = await userService.changePassword(userId, oldPassword, newPassword);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const result = await userService.deleteAccount(userId);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};
