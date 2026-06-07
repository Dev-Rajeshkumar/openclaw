import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { IAuthRequest, ITokenPayload, IApiResponse } from '../types/index.js';

export const authenticate = (
  req: IAuthRequest,
  res: Response<IApiResponse>,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as ITokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired. Please refresh your token.',
      });
      return;
    }
    res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

export const optionalAuth = (
  req: IAuthRequest,
  res: Response<IApiResponse>,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as ITokenPayload;
    req.user = decoded;
  } catch {
    // Token invalid but optional, continue without user
  }

  next();
};
