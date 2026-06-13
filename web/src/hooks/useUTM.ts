/**
 * UTM Tracking Hook
 *
 * Captures UTM parameters from URL on first visit,
 * stores them in sessionStorage, and sends to analytics API.
 *
 * Usage:
 *   useUTM(); // Call once in app layout or homepage
 */

'use client';

import { useEffect } from 'react';

interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

const UTM_STORAGE_KEY = 'cms_utm_params';
const UTM_SESSION_KEY = 'cms_utm_session_id';

export function useUTM() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Parse UTM params from URL
    const params = new URLSearchParams(window.location.search);
    const utm: UTMParams = {};

    const utmKeys: (keyof UTMParams)[] = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    ];

    let hasUTM = false;
    for (const key of utmKeys) {
      const value = params.get(key);
      if (value) {
        utm[key] = value;
        hasUTM = true;
      }
    }

    if (hasUTM) {
      // Store UTM params
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));

      // Generate session ID
      const sessionId = `utm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(UTM_SESSION_KEY, sessionId);

      // Send to analytics API
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'utm_session',
          data: { ...utm, landingPage: window.location.pathname },
        }),
      }).catch(() => {});
    }
  }, []);
}

/**
 * Get stored UTM params (for form submissions, signups, etc.)
 */
export function getUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {};
  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Get UTM session ID
 */
export function getUTMSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(UTM_SESSION_KEY);
}

/**
 * Mark current UTM session as converted
 */
export function markUTMConversion(type: string) {
  const sessionId = getUTMSessionId();
  if (!sessionId) return;

  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType: 'utm_conversion',
      data: { sessionId, conversionType: type },
    }),
  }).catch(() => {});
}
