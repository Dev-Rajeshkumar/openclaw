/**
 * Analytics Tracking Hook
 * 
 * Tracks page views, scroll depth, and time on page.
 * Sends data to /api/analytics/dashboard
 * 
 * Usage:
 *   useAnalytics(postId); // In post page component
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';

interface AnalyticsOptions {
  postId: string;
  trackScroll?: boolean;
  trackTime?: boolean;
}

export function useAnalytics({ postId, trackScroll = true, trackTime = true }: AnalyticsOptions) {
  const startTime = useRef<number>(Date.now());
  const maxScroll = useRef<number>(0);
  const trackedScrolls = useRef<Set<number>>(new Set());
  const visitorId = useRef<string>('');

  // Get or create visitor ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let vid = localStorage.getItem('cms_visitor_id');
      if (!vid) {
        vid = `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        localStorage.setItem('cms_visitor_id', vid);
      }
      visitorId.current = vid;
    }
  }, []);

  const sendEvent = useCallback(async (eventType: string, data?: Record<string, any>) => {
    try {
      await fetch('/api/analytics/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          eventType,
          visitorId: visitorId.current,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          referrer: typeof document !== 'undefined' ? document.referrer : '',
          data,
        }),
      });
    } catch {
      // Silently fail — analytics should never break UX
    }
  }, [postId]);

  // Track page view on mount
  useEffect(() => {
    sendEvent('view');
  }, [sendEvent]);

  // Track scroll depth
  useEffect(() => {
    if (!trackScroll) return;

    const handleScroll = () => {
      if (typeof window === 'undefined') return;

      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPct = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

      maxScroll.current = Math.max(maxScroll.current, scrollPct);

      // Track at 25%, 50%, 75%, 100%
      const milestones = [25, 50, 75, 100];
      for (const milestone of milestones) {
        if (maxScroll.current >= milestone && !trackedScrolls.current.has(milestone)) {
          trackedScrolls.current.add(milestone);
          sendEvent('scroll', {
            depth: milestone,
            timeToReach: Math.round((Date.now() - startTime.current) / 1000),
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [trackScroll, sendEvent]);

  // Track time on page
  useEffect(() => {
    if (!trackTime) return;

    const handleBeforeUnload = () => {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
      // Use sendBeacon for reliable delivery on page exit
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/time', JSON.stringify({
          postId,
          timeSpent,
          maxScroll: maxScroll.current,
          visitorId: visitorId.current,
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [trackTime, postId]);

  return { maxScroll: maxScroll.current };
}
