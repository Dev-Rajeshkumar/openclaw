/**
 * Redis API Response Cache Middleware
 *
 * Caches GET responses in Redis with configurable TTL.
 * Auto-invalidates on POST/PUT/DELETE to related resources.
 *
 * Usage: Applied to read-only API routes.
 */

import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true,
});

// Connect lazily
redis.connect().catch(() => {});

// Cache TTLs per resource type (seconds)
const CACHE_TTLS: Record<string, number> = {
  'posts': 300,          // 5 min
  'tags': 3600,          // 1 hour
  'categories': 3600,    // 1 hour
  'comments': 60,        // 1 min
  'search': 120,         // 2 min
  'analytics': 30,       // 30 sec
  'forms': 300,          // 5 min
  'default': 120,        // 2 min
};

// Routes that should never be cached
const SKIP_PATTERNS = [
  '/api/auth/',
  '/api/users/me',
  '/api/health',
  '/api/analytics/track',
  '/api/newsletter/subscribe',
  '/api/newsletter/unsubscribe',
  '/api/forms/',
  '/admin/',
];

// Routes that invalidate cache on mutation
const INVALIDATION_MAP: Record<string, string[]> = {
  'posts': ['posts', 'search', 'analytics'],
  'comments': ['posts', 'comments'],
  'tags': ['posts', 'tags', 'search'],
  'categories': ['posts', 'categories', 'search'],
  'reactions': ['posts'],
};

function getCacheKey(url: string, query: any): string {
  const sortedQuery = Object.keys(query || {}).sort().reduce((acc, key) => {
    acc[key] = query[key];
    return acc;
  }, {} as any);
  return `cache:${url}:${JSON.stringify(sortedQuery)}`;
}

function getResourceType(url: string): string {
  const match = url.match(/\/api\/([^/]+)/);
  return match ? match[1] : 'default';
}

function shouldSkip(url: string): boolean {
  return SKIP_PATTERNS.some(pattern => url.includes(pattern));
}

export default (config: any, { strapi }: any) => {
  return async (ctx: any, next: any) => {
    const { method, url, query } = ctx.request;

    // Only cache GET requests
    if (method !== 'GET') {
      // Invalidate related caches on mutations
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const resource = getResourceType(url);
        const toInvalidate = INVALIDATION_MAP[resource] || [resource];

        for (const res of toInvalidate) {
          const pattern = `cache:/api/${res}/*`;
          try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
              await redis.del(...keys);
            }
          } catch { /* skip cache errors */ }
        }
      }
      return next();
    }

    // Skip non-cacheable routes
    if (shouldSkip(url)) return next();

    // Skip if user is authenticated (personalized content)
    if (ctx.state.user) return next();

    const cacheKey = getCacheKey(url, query);
    const resource = getResourceType(url);
    const ttl = CACHE_TTLS[resource] || CACHE_TTLS.default;

    // Try to serve from cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        ctx.set('X-Cache', 'HIT');
        ctx.set('X-Cache-TTL', String(ttl));
        const data = JSON.parse(cached);
        return ctx.send(data);
      }
    } catch {
      // Cache miss or Redis down — continue to handler
    }

    // Execute handler
    await next();

    // Cache the response
    if (ctx.status >= 200 && ctx.status < 300 && ctx.body) {
      try {
        await redis.setex(cacheKey, ttl, JSON.stringify(ctx.body));
        ctx.set('X-Cache', 'MISS');
      } catch {
        // Silently fail — don't break the response
      }
    }
  };
};

// Manual cache management helpers
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(`cache:${pattern}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch { /* skip */ }
}

export async function flushAllCache(): Promise<void> {
  try {
    const keys = await redis.keys('cache:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch { /* skip */ }
}

export async function getCacheStats(): Promise<{ keys: number; memory: string }> {
  try {
    const keys = await redis.keys('cache:*');
    const info = await redis.info('memory');
    const memoryLine = info.split('\r\n').find((l: string) => l.startsWith('used_memory_human:'));
    return {
      keys: keys.length,
      memory: memoryLine ? memoryLine.split(':')[1] : 'unknown',
    };
  } catch {
    return { keys: 0, memory: 'unavailable' };
  }
}

export { redis as cacheRedis };
