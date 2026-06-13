/**
 * Global Rate Limiter Middleware
 * 
 * Applies per-IP rate limiting to all API routes.
 * Uses in-memory store (swap for Redis in production).
 */

import rateLimit from 'express-rate-limit';

// In-memory store (use RedisStore in production with multiple instances)
const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100;

export default (config: any, { strapi }: any) => {
  return (ctx: any, next: any) => {
    const ip = ctx.request.ip || ctx.request.headers['x-forwarded-for'] || 'unknown';
    const key = `ratelimit:${ip}`;
    const now = Date.now();

    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return next();
    }

    entry.count++;

    // Set rate limit headers
    ctx.set('X-RateLimit-Limit', String(MAX_REQUESTS));
    ctx.set('X-RateLimit-Remaining', String(Math.max(0, MAX_REQUESTS - entry.count)));
    ctx.set('X-RateLimit-Reset', new Date(entry.resetAt).toISOString());

    if (entry.count > MAX_REQUESTS) {
      ctx.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return ctx.tooManyRequests('Too many requests. Please try again later.');
    }

    return next();
  };
};
