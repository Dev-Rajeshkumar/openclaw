import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { logActivity } from '../services/activityLog.service.js';

export const activityLogger = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const startTime = Date.now();

  // Capture the original json method to intercept responses
  const originalJson = res.json.bind(res);

  res.json = (body: unknown) => {
    // Restore original json to avoid infinite loop
    res.json = originalJson;

    const duration = Date.now() - startTime;

    // Log activity asynchronously (don't block response)
    if (req.user?.userId) {
      const logData = {
        userId: req.user.userId,
        action: `${req.method} ${req.route?.path || req.path}`,
        entity: req.route?.path?.split('/')[3] || 'unknown',
        entityId: req.params.id || undefined,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        ip: req.ip || req.socket.remoteAddress || undefined,
        userAgent: req.get('user-agent') || undefined,
        metadata: {
          duration: `${duration}ms`,
          params: Object.keys(req.params).length > 0 ? req.params : undefined,
          query: Object.keys(req.query).length > 0 ? req.query : undefined,
          statusCode: res.statusCode,
        },
      };

      // Fire and forget — don't await
      logActivity(logData).catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[ActivityLog] Failed to log:', err);
        }
      });
    }

    return originalJson(body);
  };

  next();
};
