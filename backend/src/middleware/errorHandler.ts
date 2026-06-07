import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { AppError } from '../utils/response.js';
import { sendDiscordNotification } from '../services/notification.service.js';

export const errorHandler = async (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: Record<string, string[]> | undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as { code?: string; meta?: { target?: string[] } };
    if (prismaError.code === 'P2002') {
      statusCode = 409;
      const target = prismaError.meta?.target?.join(', ') || 'field';
      message = `Duplicate value for: ${target}`;
    } else if (prismaError.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    } else if (prismaError.code === 'P2003') {
      statusCode = 400;
      message = 'Invalid reference. Related record does not exist.';
    } else {
      statusCode = 400;
      message = 'Database operation failed';
    }
  } else if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid data provided';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Send Discord notification for server errors
  if (statusCode >= 500 && config.discord.notificationsEnabled) {
    try {
      await sendDiscordNotification({
        title: '🚨 Server Error',
        description: message,
        color: 0xff0000,
        fields: [
          { name: 'Status', value: `${statusCode}`, inline: true },
          { name: 'Method', value: req.method, inline: true },
          { name: 'Path', value: req.originalUrl, inline: true },
          { name: 'Error', value: err.message.substring(0, 1024) },
          { name: 'Stack', value: (err.stack || '').substring(0, 1024) },
        ],
      });
    } catch {
      // Don't let Discord notification failure affect the response
    }
  }

  // Log error in development
  if (config.env === 'development') {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);
  }

  const response: Record<string, unknown> = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  if (config.env === 'development' && statusCode >= 500) {
    response.error = err.message;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
};
