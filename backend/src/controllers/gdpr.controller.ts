import { Response, NextFunction } from 'express';
import * as gdprService from '../services/gdpr.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

/** Export all user data (GDPR right to portability). */
export const exportData = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const data = await gdprService.exportUserData(userId);
    res.status(200).json(ApiResponse.success(data, 'Data export ready'));
  } catch (error) {
    next(error);
  }
};

/** Delete user account and all data (GDPR right to erasure). */
export const deleteAccount = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { confirm } = req.body;
    if (confirm !== 'DELETE_MY_ACCOUNT') {
      res.status(400).json({
        success: false,
        message: 'Please confirm by sending { "confirm": "DELETE_MY_ACCOUNT" } in the request body.',
      });
      return;
    }
    const result = await gdprService.deleteUserAccount(userId);
    res.status(200).json(ApiResponse.success(result, 'Account and all data permanently deleted'));
  } catch (error) {
    next(error);
  }
};
