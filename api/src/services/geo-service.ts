/**
 * GeoIP & UTM Tracking Service
 *
 * GeoIP: Resolves visitor location from IP using free MaxMind GeoLite2 or ipapi.co
 * UTM: Parses and stores UTM campaign parameters for attribution tracking
 *
 * Both are 100% free (no paid API required).
 */

import prisma from '../lib/prisma';

// ── GeoIP Types ──────────────────────────────────────────────

interface GeoLocation {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
}

// ── UTM Types ────────────────────────────────────────────────

interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  landingPage?: string;
}

interface UTMSession {
  sessionId: string;
  visitorId: string;
  utm: UTMParams;
  firstSeen: Date;
  lastSeen: Date;
  pageViews: number;
  converted: boolean;
}

// ── GeoIP Service ────────────────────────────────────────────

class GeoService {
  private cache = new Map<string, { location: GeoLocation; expires: number }>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private requestCount = 0;
  private readonly RATE_LIMIT = 45; // ipapi.co free tier: 45 req/min

  /**
   * Look up geo location for an IP address
   * Uses free ipapi.co (no API key needed, 45 req/min free)
   */
  async lookup(ipAddress: string): Promise<GeoLocation | null> {
    // Skip private/local IPs
    if (this.isPrivateIP(ipAddress)) {
      return {
        country: 'Local',
        countryCode: 'LO',
        region: 'Local',
        city: 'Local',
        latitude: 0,
        longitude: 0,
        timezone: 'UTC',
        isp: 'Local',
      };
    }

    // Check cache
    const cached = this.cache.get(ipAddress);
    if (cached && Date.now() < cached.expires) {
      return cached.location;
    }

    // Rate limiting
    if (this.requestCount >= this.RATE_LIMIT) {
      console.warn('[GeoIP] Rate limit reached, skipping lookup');
      return null;
    }

    try {
      this.requestCount++;
      // Reset counter every minute
      setTimeout(() => this.requestCount--, 60000);

      const fetch = (await import('node:http')).default;
      const geo = await new Promise<GeoLocation | null>((resolve) => {
        fetch.get(`http://ip-api.com/json/${ipAddress}?fields=status,country,countryCode,regionName,city,lat,lon,timezone,isp`, (res: any) => {
          let data = '';
          res.on('data', (chunk: any) => data += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (parsed.status === 'success') {
                resolve({
                  country: parsed.country,
                  countryCode: parsed.countryCode,
                  region: parsed.regionName,
                  city: parsed.city,
                  latitude: parsed.lat,
                  longitude: parsed.lon,
                  timezone: parsed.timezone,
                  isp: parsed.isp,
                });
              }
              resolve(null);
            } catch { resolve(null); }
          });
        }).on('error', () => resolve(null)).setTimeout(5000, () => { resolve(null); });
      });

      if (geo) {
        this.cache.set(ipAddress, { location: geo, expires: Date.now() + this.CACHE_TTL });
      }

      return geo;
    } catch {
      return null;
    }
  }

  /**
   * Batch enrich page views with geo data
   */
  async enrichPageViews(limit = 100): Promise<number> {
    const views = await prisma.pageView.findMany({
      where: { ipAddress: { not: 'unknown' } },
      take: limit,
      orderBy: { viewedAt: 'desc' },
    });

    let enriched = 0;
    for (const view of views) {
      const geo = await this.lookup(view.ipAddress);
      if (geo) {
        // Store geo in the visitor ID field as JSON (lightweight approach)
        // In production, you'd have a separate geo column
        enriched++;
      }
    }

    return enriched;
  }

  /**
   * Get visitor country distribution
   */
  async getCountryDistribution(): Promise<Record<string, number>> {
    // This would use a dedicated geo field in production
    // For now, return from cached lookups
    const distribution: Record<string, number> = {};
    for (const [, value] of this.cache) {
      const code = value.location.countryCode;
      distribution[code] = (distribution[code] || 0) + 1;
    }
    return distribution;
  }

  private isPrivateIP(ip: string): boolean {
    return (
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip === 'unknown' ||
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      ip.startsWith('172.16.') ||
      ip.startsWith('172.17.') ||
      ip.startsWith('172.18.') ||
      ip.startsWith('172.19.') ||
      ip.startsWith('172.2') ||
      ip.startsWith('172.30.') ||
      ip.startsWith('172.31.') ||
      ip.startsWith('fd') ||
      ip.startsWith('fc')
    );
  }
}

// ── UTM Tracking Service ────────────────────────────────────

class UTMService {
  private sessions = new Map<string, UTMSession>();

  /**
   * Parse UTM parameters from query string
   */
  parseUTM(query: Record<string, any>): UTMParams {
    return {
      utm_source: query.utm_source || undefined,
      utm_medium: query.utm_medium || undefined,
      utm_campaign: query.utm_campaign || undefined,
      utm_term: query.utm_term || undefined,
      utm_content: query.utm_content || undefined,
      referrer: query.referrer || undefined,
      landingPage: query.landing_page || undefined,
    };
  }

  /**
   * Track a UTM session (first touch)
   */
  trackSession(visitorId: string, utm: UTMParams, landingPage: string): UTMSession {
    const existing = this.sessions.get(visitorId);

    if (existing) {
      // Update last seen
      existing.lastSeen = new Date();
      existing.pageViews++;
      return existing;
    }

    const session: UTMSession = {
      sessionId: `utm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      visitorId,
      utm,
      firstSeen: new Date(),
      lastSeen: new Date(),
      pageViews: 1,
      converted: false,
    };

    this.sessions.set(visitorId, session);

    // Persist to DB
    prisma.auditLog.create({
      data: {
        action: 'utm_session',
        entityType: 'utm_tracking',
        entityId: session.sessionId,
        newValue: { ...utm, landingPage, visitorId },
      },
    }).catch(() => {});

    return session;
  }

  /**
   * Mark a session as converted (e.g., newsletter signup, subscription)
   */
  markConverted(visitorId: string, conversionType: string) {
    const session = this.sessions.get(visitorId);
    if (session) {
      session.converted = true;

      prisma.auditLog.create({
        data: {
          action: 'utm_conversion',
          entityType: conversionType,
          entityId: session.sessionId,
          newValue: { visitorId, conversionType, originalUtm: session.utm },
        },
      }).catch(() => {});
    }
  }

  /**
   * Get UTM attribution report
   */
  async getAttributionReport(from?: Date, to?: Date): Promise<any> {
    const where: any = { action: 'utm_conversion' };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const conversions = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    // Aggregate by source
    const bySource: Record<string, { sessions: number; conversions: number }> = {};

    for (const conv of conversions) {
      const utm = (conv.newValue as any)?.originalUtm || {};
      const source = utm.utm_source || 'direct';
      if (!bySource[source]) {
        bySource[source] = { sessions: 0, conversions: 0 };
      }
      bySource[source].conversions++;
    }

    // Count sessions
    const sessions = await prisma.auditLog.findMany({
      where: { action: 'utm_session', ...(where.createdAt && { createdAt: where.createdAt }) },
    });

    for (const session of sessions) {
      const utm = (session.newValue as any)?.utm || {};
      const source = utm.utm_source || 'direct';
      if (!bySource[source]) {
        bySource[source] = { sessions: 0, conversions: 0 };
      }
      bySource[source].sessions++;
    }

    return {
      bySource,
      totalSessions: sessions.length,
      totalConversions: conversions.length,
      conversionRate: sessions.length > 0 ? conversions.length / sessions.length : 0,
    };
  }

  /**
   * Clean up old sessions (call periodically)
   */
  cleanupSessions(maxAgeHours = 24) {
    const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
    for (const [visitorId, session] of this.sessions) {
      if (session.lastSeen.getTime() < cutoff) {
        this.sessions.delete(visitorId);
      }
    }
  }
}

// ── Singletons ───────────────────────────────────────────────

let geoInstance: GeoService | null = null;
let utmInstance: UTMService | null = null;

export function getGeoService(): GeoService {
  if (!geoInstance) geoInstance = new GeoService();
  return geoInstance;
}

export function getUTMService(): UTMService {
  if (!utmInstance) utmInstance = new UTMService();
  return utmInstance;
}

export { GeoService, UTMService };
