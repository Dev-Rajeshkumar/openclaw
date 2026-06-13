'use client';

import { useState, useCallback } from 'react';

interface SubscribeFormProps {
  variant?: 'default' | 'inline';
  buttonText?: string;
  onSuccess?: () => void;
}

export function SubscribeForm({ variant = 'default', buttonText = 'Subscribe', onSuccess }: SubscribeFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || undefined }),
      });

      if (res.ok) {
        setStatus('success');
        setMessage('Check your inbox to confirm your subscription. Thanks!');
        setEmail('');
        setName('');
        onSuccess?.();
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Subscription failed');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }

    setLoading(false);
  }, [email, name, onSuccess]);

  const inputClass = variant === 'inline'
    ? 'input !py-2 !text-sm bg-white/10 border-white/30 text-white placeholder:text-primary-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100'
    : 'input';

  const buttonClass = variant === 'inline'
    ? 'btn bg-white text-primary-700 hover:bg-primary-50 whitespace-nowrap'
    : 'btn-primary w-full';

  return (
    <div>
      <form onSubmit={handleSubmit} className={variant === 'inline' ? 'flex gap-2 max-w-md' : 'space-y-3'}>
        {variant !== 'inline' && (
          <div>
            <label htmlFor="subscribe-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="subscribe-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className={inputClass}
              autoComplete="given-name"
            />
          </div>
        )}
        <div className={variant === 'inline' ? 'flex-1' : ''}>
          {variant !== 'inline' && (
            <label htmlFor="subscribe-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
          )}
          <div className={variant === 'inline' ? '' : 'flex gap-2'}>
            <input
              id="subscribe-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className={`${inputClass} ${variant !== 'inline' ? 'flex-1' : 'w-full'}`}
              autoComplete="email"
              aria-describedby={status !== 'idle' ? 'subscribe-status' : undefined}
            />
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className={buttonClass}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Subscribing...
                </span>
              ) : (
                buttonText
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Status Messages */}
      {status !== 'idle' && (
        <div
          id="subscribe-status"
          role="alert"
          className={`mt-3 p-3 rounded-md text-sm ${
            status === 'success'
              ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          {status === 'success' ? (
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{message}</span>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{message}</span>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        No spam. Unsubscribe anytime. We respect your privacy.
      </p>
    </div>
  );
}
