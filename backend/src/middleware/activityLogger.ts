import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'crypto';
import { IAuthRequest } from '../types/index.js';
import { activityLogService } from '../services/activityLog.service.js';

/**
 * Generate short unique request ID
 */
const generateRequestId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
};

/**
 * Attach request ID to every incoming request
 */
export const requestIdMiddleware = (
  req: IAuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  req.requestId = req.get('X-Request-ID') || generateRequestId();
  next();
};

/**
 * Activity logging middleware — logs every API call
 * Should be applied AFTER auth middleware so req.user is available
 */
export const activityLogger = (
  action: string,
  entity: string
) => {
  return (req: IAuthRequest, _res: Response, next: NextFunction): void => {
    // Store original json method to intercept response
    const originalJson = _res.json.bind(_res);

    _res.json = (body: Record<string, unknown>) => {
      // Log activity asynchronously (don't block response)
      const userId = req.user?.userId || 'system';
      
      activityLogService.log({
        userId,
        action,
        entity,
        entityId: (req.params?.id as string) || undefined,
        method: req.method,
        path: req.originalUrl,
        statusCode: _res.statusCode,
        ip: req.ip || req.socket.remoteAddress || undefined,
        userAgent: req.get('user-agent') || undefined,
        requestBody: req.body && Object.keys(req.body).length > 0
          ? (req.body as Record<string, unknown>)
          : undefined,
        metadata: {
          requestId: req.requestId,
          query: Object.keys(req.query || {}).length > 0 ? req.query : undefined,
          params: Object.keys(req.params || {}).length > 0 ? req.params : undefined,
        },
      }).catch((err) => {
        console.error('[ACTIVITY_LOG_ERROR]', err);
      });

      return originalJson(body);
    };

    next();
  };
};

/**
 * Auto-detect action and entity from request
 * Usage: autoActivityLogger — logs based on HTTP method and route
 */
export const autoActivityLogger = (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const originalJson = res.json.bind(res);

  res.json = (body: Record<string, unknown>) => {
    const userId = req.user?.userId || 'system';
    const { method, originalUrl, params } = req;

    // Detect action from HTTP method
    const actionMap: Record<string, string> = {
      GET: 'READ',
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };

    // Detect entity from path
    const pathParts = originalUrl.split('/').filter(Boolean);
    const entityParts = pathParts.filter(
      (p) => !p.startsWith('api') && !p.match(/^[0-9a-f-]{20,}$/) && p !== 'v1'
    );
    const entity = entityParts[0]?.toUpperCase() || 'UNKNOWN';

    const action = `${actionMap[method] || method}_${entity}`;

    activityLogService.log({
      userId,
      action,
      entity,
      entityId: (params?.id as string) || undefined,
      method,
      path: originalUrl,
      statusCode: res.statusCode,
      ip: req.ip || undefined,
      userAgent: req.get('user-agent') || undefined,
      requestBody: method !== 'GET' && req.body && Object.keys(req.body).length > 0
        ? (req.body as Record<string, unknown>)
        : undefined,
      metadata: {
        requestId: req.requestId,
        query: Object.keys(req.query || {}).length > 0 ? req.query : undefined,
      },
    }).catch((err) => {
      console.error('[ACTIVITY_LOG_ERROR]', err);
    });

    return originalJson(body);
  };

  next();
};
