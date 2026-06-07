import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';
import { IAuthRequest, ITokenPayload, IApiResponse } from '../types/index.js';

const prisma = new PrismaClient();

export const authenticate = (
  req: IAuthRequest,
  res: Response<IApiResponse>,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as ITokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: 'Token expired. Please refresh your token.' });
      return;
    }
    res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

/**
 * Middleware to set active business context
 * Expects businessId in query param, header, or uses default
 */
export const requireBusiness = async (
  req: IAuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    next(new AppError('Authentication required', 401));
    return;
  }

  try {
    const businessId =
      (req.query.businessId as string) ||
      (req.headers['x-business-id'] as string);

    if (businessId) {
      // Verify user owns this business
      const business = await prisma.business.findFirst({
        where: { id: businessId, userId: req.user.userId, deletedAt: null },
      });
      if (!business) {
        next(new AppError('Business not found or access denied', 404));
        return;
      }
      req.businessId = businessId;
      req.business = business;
    } else {
      // Use default business
      const defaultBusiness = await prisma.business.findFirst({
        where: { userId: req.user.userId, deletedAt: null },
        orderBy: { createdAt: 'asc' },
      });
      if (!defaultBusiness) {
        next(new AppError('No business found. Please create one first.', 404));
        return;
      }
      req.businessId = defaultBusiness.id;
      req.business = defaultBusiness;
    }

    next();
  } catch (error) {
    next(error);
  }
};

export { AppError } from './errorHandler.js';
