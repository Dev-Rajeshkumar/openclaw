import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.js';
import { IAuthRequest, IApiResponse } from '../types/index.js';
import { RegisterInput, LoginInput, RefreshTokenInput } from '../validators/auth.validator.js';

export class AuthController {
  /**
   * POST /api/auth/register
   */
  async register(req: Request, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await authService.register(req.body as RegisterInput);
      sendSuccess(res, result, 'Registration successful', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(req: Request, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await authService.login(req.body as LoginInput);
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   */
  async refreshToken(req: Request, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const { refreshToken } = req.body as RefreshTokenInput;
      const tokens = await authService.refreshToken(refreshToken);
      sendSuccess(res, tokens, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   */
  async me(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const { userService } = await import('../services/user.service.js');
      const user = await userService.getProfile(req.user!.userId);
      sendSuccess(res, user, 'Profile fetched successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
