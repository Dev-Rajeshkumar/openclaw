/**
 * Content Security Policy Middleware
 *
 * Sets strict CSP headers to prevent XSS, clickjacking, and data injection.
 * Configurable per environment.
 */

import helmet from 'helmet';

const DEV_CSP = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Needed for Strapi admin
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
    imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
    connectSrc: ["'self'", 'https://api.*', 'wss:', 'ws:'],
    mediaSrc: ["'self'", 'https:', 'blob:'],
    frameSrc: ["'self'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: [],
  },
};

const PROD_CSP = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"], // Next.js requires unsafe-inline
    fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'"],
    mediaSrc: ["'self'", 'https:'],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: [],
  },
};

export default (config: any, { strapi }: any) => {
  const isDev = process.env.NODE_ENV === 'development';
  const cspConfig = isDev ? DEV_CSP : PROD_CSP;

  return async (ctx: any, next: any) => {
    // Apply CSP via Helmet
    await new Promise<void>((resolve) => {
      helmet.contentSecurityPolicy(cspConfig)(ctx.req as any, ctx.res as any, () => {
        resolve();
      });
    });

    // Additional security headers
    ctx.set('X-Content-Type-Options', 'nosniff');
    ctx.set('X-Frame-Options', 'SAMEORIGIN');
    ctx.set('X-XSS-Protection', '1; mode=block');
    ctx.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    ctx.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // HSTS in production
    if (!isDev) {
      ctx.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    return next();
  };
};
