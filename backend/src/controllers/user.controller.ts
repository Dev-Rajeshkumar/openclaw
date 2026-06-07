import { Response, NextFunction } from 'express';
import { userService } from '../services/user.service.js';
import { sendSuccess } from '../utils/response.js';
import { IAuthRequest, IApiResponse } from '../types/index.js';
import { UpdateProfileInput, ChangePasswordInput, UpdatePlanInput } from '../validators/user.validator.js';

export class UserController {
  /**
   * GET /api/users/profile
   */
  async getProfile(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await userService.getProfile(req.user!.userId);
      sendSuccess(res, result, 'Profile fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/profile
   */
  async updateProfile(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await userService.updateProfile(
        req.user!.userId,
        req.body as UpdateProfileInput
      );
      sendSuccess(res, result, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/change-password
   */
  async changePassword(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await userService.changePassword(
        req.user!.userId,
        req.body as ChangePasswordInput
      );
      sendSuccess(res, result, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/plan
   */
  async updatePlan(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await userService.updatePlan(
        req.user!.userId,
        req.body as UpdatePlanInput
      );
      sendSuccess(res, result, 'Plan updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
