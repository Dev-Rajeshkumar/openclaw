import { Request, Response, NextFunction } from 'express';

/**
 * Recursively strip HTML/script tags from string values in an object.
 * Prevents XSS attacks from stored user input that may be rendered in the frontend.
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    // Remove script/event-handler content, then strip remaining HTML tags
    return value
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/on\w+\s*=\s*[^>\s]*/gi, '')
      .replace(/javascript\s*:/gi, '')
      .trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = sanitizeValue(v);
    }
    return result;
  }
  return value;
}

/** Express middleware that sanitizes req.body, req.query, and req.params. */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query) as typeof req.query;
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params) as typeof req.params;
  }
  next();
}
