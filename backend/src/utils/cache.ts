/**
 * Simple in-memory cache with TTL support.
 * Used for dashboard stats and other frequently-accessed, slowly-changing data.
 * For production with multiple instances, replace with Redis.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/** Get a cached value, or null if expired/missing. */
export function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

/** Set a cached value with TTL in seconds. */
export function cacheSet<T>(key: string, data: T, ttlSeconds: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

/** Invalidate a specific cache key. */
export function cacheInvalidate(key: string): void {
  cache.delete(key);
}

/** Invalidate all keys matching a prefix. */
export function cacheInvalidatePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

/** Clear the entire cache. */
export function cacheClear(): void {
  cache.clear();
}
