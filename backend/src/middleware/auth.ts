import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AuthenticatedRequest, JwtPayload } from '../types/index.js';
import { AppError } from '../utils/response.js';

export const auth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Access denied. Invalid token format.', 401);
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    if (!decoded.userId || !decoded.email) {
      throw new AppError('Invalid token payload.', 401);
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid or expired token.', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token has expired. Please login again.', 401));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      req.user = decoded;
    }

    next();
  } catch {
    next();
  }
};

export const requireBusiness = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const businessId =
      req.headers['x-business-id'] as string ||
      req.params.businessId ||
      req.query.businessId as string ||
      req.body.businessId;

    if (!businessId) {
      throw new AppError('Business context required. Provide businessId.', 400);
    }

    req.businessId = businessId;
    next();
  } catch (error) {
    next(error);
  }
 };

export { auth as default };
