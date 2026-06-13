'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' };
  if (score <= 4) return { score, label: 'Strong', color: 'bg-green-500' };
  return { score, label: 'Very Strong', color: 'bg-emerald-500' };
}

export default function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMatch = password === confirmPassword;
  const showMismatch = confirmPassword.length > 0 && !passwordsMatch;

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Registration failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    }

    setLoading(false);
  }, [username, email, password, passwordsMatch, agreedToTerms, router]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800" role="alert">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_-]+"
          autoComplete="username"
          placeholder="johndoe"
          className="input"
        />
        <p className="text-xs text-gray-500 mt-1">3-30 characters. Letters, numbers, underscores, hyphens.</p>
      </div>

      <div>
        <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <input
          id="reg-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="input"
        />
      </div>

      <div>
        <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password
        </label>
        <div className="relative">
          <input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Create a strong password"
            className="input pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {password.length > 0 && (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    level <= strength.score ? strength.color : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <p className={`text-xs ${strength.score <= 1 ? 'text-red-500' : strength.score <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>
              {strength.label}
            </p>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Confirm Password
        </label>
        <input
          id="confirm-password"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="Confirm your password"
          className={`input ${showMismatch ? 'border-red-500 focus:ring-red-500' : ''}`}
        />
        {showMismatch && (
          <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
        )}
      </div>

      {/* Terms of Service */}
      <div className="flex items-start gap-2">
        <input
          id="terms"
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="mt-1 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
          I agree to the{' '}
          <a href="/terms" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading || !username.trim() || !email.trim() || !password || !passwordsMatch || !agreedToTerms}
        className="btn-primary w-full"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Creating account...
          </span>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  );
}
