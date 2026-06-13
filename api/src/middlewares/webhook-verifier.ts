/**
 * Webhook Signature Verification Middleware
 *
 * Validates incoming webhook payloads using HMAC-SHA256 signatures.
 * Supports providers: Stripe, GitHub, SendGrid, Mailgun, custom.
 *
 * Usage: Applied to webhook receiver routes.
 */

import crypto from 'crypto';

const TIMESTAMP_TOLERANCE = 5 * 60 * 1000; // 5 minutes

interface WebhookConfig {
  secret: string;
  signatureHeader: string;
  algorithm: string;
  encoding: 'hex' | 'base64';
  timestampHeader?: string;
  tolerance?: number;
}

// Provider-specific configs
const PROVIDER_CONFIGS: Record<string, Partial<WebhookConfig>> = {
  stripe: {
    signatureHeader: 'stripe-signature',
    algorithm: 'sha256',
    encoding: 'hex',
  },
  github: {
    signatureHeader: 'x-hub-signature-256',
    algorithm: 'sha256',
    encoding: 'hex',
  },
  sendgrid: {
    signatureHeader: 'x-twilio-email-event-webhook-signature',
    algorithm: 'sha256',
    encoding: 'base64',
  },
  mailgun: {
    signatureHeader: 'x-mailgun-signature',
    algorithm: 'sha256',
    encoding: 'hex',
    timestampHeader: 'x-mailgun-timestamp',
  },
};

/**
 * Verify HMAC signature of a webhook payload
 */
export function verifySignature(
  payload: string | Buffer,
  signature: string,
  secret: string,
  algorithm = 'sha256',
  encoding: 'hex' | 'base64' = 'hex'
): boolean {
  const hmac = crypto.createHmac(algorithm, secret);
  const expected = hmac.update(payload).digest(encoding);

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

/**
 * Verify Stripe-style signature: t=timestamp,v1=signature
 */
export function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string
): boolean {
  const elements = signatureHeader.split(',');
  let timestamp = '';
  let signature = '';

  for (const element of elements) {
    const [key, value] = element.split('=');
    if (key === 't') timestamp = value;
    if (key === 'v1') signature = value;
  }

  if (!timestamp || !signature) return false;

  // Check timestamp tolerance
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);
  if (Math.abs(now - ts) > TIMESTAMP_TOLERANCE / 1000) return false;

  const signedPayload = `${timestamp}.${payload}`;
  return verifySignature(signedPayload, signature, secret);
}

/**
 * Express/Koa middleware factory
 */
export function createWebhookVerifier(config: WebhookConfig) {
  return async (ctx: any, next: any) => {
    const signature = ctx.request.headers[config.signatureHeader];
    if (!signature) {
      return ctx.unauthorized('Missing webhook signature');
    }

    // Timestamp check (replay protection)
    if (config.timestampHeader) {
      const timestamp = ctx.request.headers[config.timestampHeader];
      if (timestamp) {
        const ts = parseInt(String(timestamp), 10);
        const now = Date.now();
        const tolerance = config.tolerance || TIMESTAMP_TOLERANCE;
        if (Math.abs(now - ts * 1000) > tolerance) {
          return ctx.badRequest('Webhook timestamp too old (replay protection)');
        }
      }
    }

    // Get raw body
    const rawBody = ctx.request.bodyRaw || JSON.stringify(ctx.request.body);

    // Verify signature
    const isValid = verifySignature(
      rawBody,
      signature,
      config.secret,
      config.algorithm,
      config.encoding
    );

    if (!isValid) {
      return ctx.unauthorized('Invalid webhook signature');
    }

    return next();
  };
}

/**
 * Auto-detect provider and verify
 */
export function autoVerify(provider: string, secret: string) {
  const providerConfig = PROVIDER_CONFIGS[provider];
  if (!providerConfig) {
    throw new Error(`Unknown webhook provider: ${provider}. Supported: ${Object.keys(PROVIDER_CONFIGS).join(', ')}`);
  }

  const config: WebhookConfig = {
    secret,
    signatureHeader: providerConfig.signatureHeader!,
    algorithm: providerConfig.algorithm || 'sha256',
    encoding: providerConfig.encoding || 'hex',
    timestampHeader: providerConfig.timestampHeader,
  };

  if (provider === 'stripe') {
    return async (ctx: any, next: any) => {
      const sig = ctx.request.headers['stripe-signature'];
      if (!sig) return ctx.unauthorized('Missing Stripe signature');
      const rawBody = ctx.request.bodyRaw || JSON.stringify(ctx.request.body);
      if (!verifyStripeSignature(rawBody, sig, secret)) {
        return ctx.unauthorized('Invalid Stripe signature');
      }
      return next();
    };
  }

  return createWebhookVerifier(config);
}

export { PROVIDER_CONFIGS, TIMESTAMP_TOLERANCE };
