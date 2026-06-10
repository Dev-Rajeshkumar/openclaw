import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, fullName } = req.body;
    const result = await authService.register({ email, password, fullName });
    res.status(201).json(ApiResponse.created(result, 'Registration successful'));
  } catch (error) { next(error); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.status(200).json(ApiResponse.success(result, 'Login successful'));
  } catch (error) { next(error); }
};

export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { googleId, email, fullName, avatar } = req.body;
    const result = await authService.loginWithGoogle({ googleId, email, fullName, avatar });
    res.status(200).json(ApiResponse.success(result, 'Google authentication successful'));
  } catch (error) { next(error); }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const result = await authService.resetPassword(email);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) { next(error); }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await authService.verifyToken(req.headers.authorization!.split(' ')[1]);
    res.status(200).json(ApiResponse.success(user));
  } catch (error) { next(error); }
};

/** Refresh access token using a valid refresh token (with rotation). */
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError('Refresh token required', 400);

    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await authService.rotateRefreshToken(refreshToken, ipAddress, userAgent);

    res.status(200).json(ApiResponse.success(result, 'Token refreshed'));
  } catch (error) { next(error); }
};

/** Logout — revoke all refresh tokens for the current user. */
export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    await authService.revokeAllUserTokens(userId);
    res.status(200).json(ApiResponse.success(null, 'Logged out successfully'));
  } catch (error) { next(error); }
};

import { AppError } from '../utils/response.js';
