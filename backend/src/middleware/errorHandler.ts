import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { IApiResponse, IAuthRequest } from '../types/index.js';
import { notificationService } from '../services/notification.service.js';

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
  req: IAuthRequest,
  res: Response<IApiResponse>,
  _next: NextFunction
): void => {
  const requestId = req.requestId;

  // Determine if this is an operational error or a bug
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const message = isAppError ? err.message : 'Internal server error';

  // Log the error
  console.error(`[ERROR] ${req.method} ${req.path}`, {
    statusCode,
    message: err.message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
    requestId,
    userId: req.user?.userId,
    ip: req.ip,
  });

  // Send exception notification for server errors (500+) and uncaught exceptions
  if (statusCode >= 500 || !isAppError) {
    notificationService.sendException(err, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId || 'anonymous',
      ip: req.ip || 'unknown',
      requestId: requestId || 'none',
      userAgent: req.get('user-agent') || 'unknown',
    }).catch((notifyErr) => {
      // Don't let notification errors cascade
      console.error('[NOTIFICATION_ERROR]', notifyErr);
    });
  }

  // Send warning notification for 4xx client errors in production
  if (statusCode === 401 || statusCode === 403) {
    notificationService.send({
      title: `Auth ${statusCode} - ${req.method} ${req.path}`,
      message: `${err.message} | User: ${req.user?.userId || 'anonymous'} | IP: ${req.ip || 'unknown'}`,
      severity: 'warning',
      timestamp: new Date().toISOString(),
    }).catch(() => {});
  }

  // Build response
  const response: IApiResponse = {
    success: false,
    message,
    requestId,
  };

  if (config.nodeEnv === 'development') {
    response.error = err.message;
    if (!isAppError && err.stack) {
      response.error += `\n${err.stack}`;
    }
  }

  res.status(statusCode).json(response);
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
