'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

export default function NewsletterUnsubscribePage() {
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submittedFeedback, setSubmittedFeedback] = useState(false);

  const handleUnsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      await fetch('/api/newsletter/unsubscribe', { method: 'POST' });
      setUnsubscribed(true);
    } catch {
      // handle error
    }
    setLoading(false);
  }, []);

  const handleFeedback = useCallback(async () => {
    if (!feedback.trim()) return;
    try {
      await fetch('/api/newsletter/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
      setSubmittedFeedback(true);
    } catch {
      // handle error
    }
  }, [feedback]);

  if (unsubscribed) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">You&apos;ve been unsubscribed</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You will no longer receive emails from us. We&apos;re sorry to see you go!
          </p>

          {/* Feedback Form */}
          {!submittedFeedback ? (
            <div className="card p-6 text-left mb-6">
              <h2 className="text-sm font-semibold mb-2">Help us improve (optional)</h2>
              <p className="text-xs text-gray-500 mb-3">Why are you unsubscribing?</p>
              <div className="space-y-2 mb-3">
                {[
                  'Too many emails',
                  'Content is not relevant',
                  'Did not sign up for this',
                  'Other',
                ].map((reason) => (
                  <label key={reason} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input type="radio" name="reason" className="text-primary-600 focus:ring-primary-500" />
                    {reason}
                  </label>
                ))}
              </div>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Additional feedback..."
                rows={3}
                className="input text-sm mb-3"
              />
              <button onClick={handleFeedback} className="btn-secondary text-sm w-full">
                Submit Feedback
              </button>
            </div>
          ) : (
            <p className="text-sm text-green-600 mb-6">Thank you for your feedback!</p>
          )}

          {/* Resubscribe */}
          <div className="card p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Changed your mind?</p>
            <Link href="/newsletter/subscribe" className="btn-primary w-full">
              Resubscribe
            </Link>
          </div>

          <Link href="/" className="inline-block mt-6 text-sm text-primary-600 hover:underline">
            ← Back to homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Unsubscribe from Newsletter</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We&apos;re sorry to see you go. Click below to unsubscribe from all emails.
        </p>

        <button
          onClick={handleUnsubscribe}
          disabled={loading}
          className="btn border-red-300 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 w-full mb-4"
        >
          {loading ? 'Unsubscribing...' : 'Yes, Unsubscribe Me'}
        </button>

        <Link href="/newsletter/preferences" className="text-sm text-primary-600 hover:underline inline-block mb-2">
          Or manage your preferences instead
        </Link>

        <br />

        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← Back to homepage
        </Link>
      </div>
    </div>
  );
}
