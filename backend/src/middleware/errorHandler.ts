import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { IApiResponse } from '../types/index.js';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response<IApiResponse>,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({
      success: false,
      message: 'Database error occurred',
      ...(config.nodeEnv === 'development' && { error: err.message }),
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
    return;
  }

  // Default error
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(config.nodeEnv === 'development' && { error: err.message, stack: err.stack }),
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response<IApiResponse>
): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};
