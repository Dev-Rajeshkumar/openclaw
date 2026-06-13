'use client';

import { useState } from 'react';
import Link from 'next/link';

interface PaywallGateProps {
  isPremium: boolean;
  isSubscriber: boolean;
  freeReadCount: number;
  totalFreeReads: number;
  children: React.ReactNode;
  teaserContent?: string;
}

export function PaywallGate({
  isPremium,
  isSubscriber,
  freeReadCount,
  totalFreeReads,
  children,
  teaserContent,
}: PaywallGateProps) {
  const remaining = Math.max(0, totalFreeReads - freeReadCount);
  const showPaywall = isPremium && !isSubscriber && remaining <= 0;

  if (!showPaywall) {
    return <>{children}</>;
  }

  const progressPct = Math.min(100, (freeReadCount / totalFreeReads) * 100);

  return (
    <div className="relative">
      {/* Teaser content */}
      {teaserContent && (
        <div className="prose-content mb-6" dangerouslySetInnerHTML={{ __html: teaserContent }} />
      )}

      {/* Blurred preview of rest */}
      <div className="relative">
        <div className="overflow-hidden max-h-48 relative">
          <div className="opacity-20 pointer-events-none select-none" aria-hidden="true">
            {children}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-gray-900 to-transparent" />
        </div>

        {/* Paywall Card */}
        <div className="relative -mt-8 z-10">
          <div className="card p-8 mx-auto max-w-md text-center border-2 border-primary-200 dark:border-primary-800 shadow-lg">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <h3 className="text-xl font-bold mb-2">Subscribe to continue reading</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              You&apos;ve used {freeReadCount} of {totalFreeReads} free reads this month.
            </p>

            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-6" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="space-y-3">
              <Link href="/newsletter/subscribe" className="btn-primary w-full justify-center">
                Subscribe — Free
              </Link>
              <p className="text-xs text-gray-500">
                Already subscribed?{' '}
                <Link href="/login" className="text-primary-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
