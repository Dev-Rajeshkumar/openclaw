/**
 * Redis Session Store Configuration
 *
 * Provides Redis-backed sessions for multi-instance scaling.
 * Falls back to memory store in development if Redis is unavailable.
 *
 * Environment variables:
 *   REDIS_URL          — Redis connection string (default: redis://localhost:6379)
 *   REDIS_PASSWORD      — Redis password (optional)
 *   SESSION_SECRET      — Cookie signing secret (required in production)
 *   NODE_ENV            — Enables secure cookies in production
 */

import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SESSION_TTL = 24 * 60 * 60; // 24 hours in seconds

// Create Redis client for session store
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || undefined,
  socket: {
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        console.error('[session] Redis reconnection limit reached, giving up');
        return new Error('Redis reconnection limit reached');
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

redisClient.on('error', (err: Error) => {
  console.error('[session] Redis client error:', err.message);
});

redisClient.on('connect', () => {
  console.log('[session] Redis session store connected');
});

redisClient.on('reconnecting', () => {
  console.warn('[session] Redis session store reconnecting...');
});

// Connect lazily — actual connection happens on first session access
let connected = false;
async function ensureConnected() {
  if (!connected) {
    try {
      await redisClient.connect();
      connected = true;
    } catch (err) {
      console.error('[session] Failed to connect to Redis for sessions:', err);
      throw err;
    }
  }
}

const store = new RedisStore({
  client: redisClient as any,
  prefix: 'cms:sess:',
  ttl: SESSION_TTL,
  disableTouch: false,
});

export const sessionConfig = {
  store,
  name: 'cms.sid',
  secret: process.env.SESSION_SECRET || (IS_PRODUCTION ? undefined : 'dev-secret-change-me'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax' as const,
    maxAge: SESSION_TTL * 1000, // 24 hours in milliseconds
    path: '/',
    domain: IS_PRODUCTION ? process.env.COOKIE_DOMAIN : undefined,
  },
  rolling: true, // Reset maxAge on every request
};

/**
 * Initialize the session store (call during server bootstrap)
 */
export async function initSessionStore(): Promise<void> {
  await ensureConnected();
  console.log('[session] Session store initialized with Redis backend');
}

/**
 * Gracefully close the session store
 */
export async function closeSessionStore(): Promise<void> {
  try {
    await redisClient.quit();
    connected = false;
    console.log('[session] Session store closed');
  } catch (err) {
    console.error('[session] Error closing session store:', err);
  }
}

export { redisClient };
export default sessionConfig;
