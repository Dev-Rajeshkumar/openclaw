import { Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.js';
import { IAuthRequest, IApiResponse } from '../types/index.js';
import { RegisterInput, LoginInput, GoogleAuthInput } from '../validators/auth.validator.js';

export class AuthController {
  async register(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await authService.register(req.body as RegisterInput);
      sendSuccess(res, result, 'Registration successful', 201);
    } catch (error) { next(error); }
  }

  async login(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await authService.login(req.body as LoginInput);
      sendSuccess(res, result, 'Login successful');
    } catch (error) { next(error); }
  }

  async googleAuth(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const { idToken } = req.body as GoogleAuthInput;
      const result = await authService.googleAuth(idToken);
      sendSuccess(res, result, 'Google authentication successful');
    } catch (error) { next(error); }
  }

  async refreshToken(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      const tokens = await authService.refreshToken(refreshToken);
      sendSuccess(res, tokens, 'Token refreshed successfully');
    } catch (error) { next(error); }
  }

  async me(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const { userService } = await import('../services/user.service.js');
      const user = await userService.getProfile(req.user!.userId);
      sendSuccess(res, user, 'Profile fetched successfully');
    } catch (error) { next(error); }
  }
}

export const authController = new AuthController();
