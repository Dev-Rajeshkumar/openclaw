'use client';

import { useState, useCallback } from 'react';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send reset link');
      }

      setStatus('success');
      setMessage('If an account exists with that email, you will receive a password reset link shortly. Check your inbox and spam folder.');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }

    setLoading(false);
  }, [email]);

  if (status === 'success') {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Check your email</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{message}</p>
        <button
          onClick={() => { setStatus('idle'); setMessage(''); }}
          className="text-sm text-primary-600 hover:underline"
        >
          Didn&apos;t receive it? Try again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status === 'error' && (
        <div className="p-3 rounded-md bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800" role="alert">
          {message}
        </div>
      )}

      <div>
        <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email address
        </label>
        <input
          id="reset-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="input"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !email.trim()}
        className="btn-primary w-full"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sending...
          </span>
        ) : (
          'Send Reset Link'
        )}
      </button>
    </form>
  );
}
