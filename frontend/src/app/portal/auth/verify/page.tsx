'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ClientPortalVerify() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Invalid login link');
      return;
    }

    fetch(`${API_URL}/v1/portal/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          // Store token in localStorage
          localStorage.setItem('client_token', json.data.token);
          localStorage.setItem('client_info', JSON.stringify(json.data.client));
          setStatus('success');
          // Redirect to dashboard after a moment
          setTimeout(() => router.push('/portal/invoices'), 1500);
        } else {
          setStatus('error');
          setErrorMsg(json.message || 'Invalid or expired link');
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorMsg('Failed to verify login link');
      });
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 size={40} className="animate-spin text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900">Verifying your login...</h2>
            <p className="text-sm text-gray-500 mt-1">Please wait</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={40} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900">Login successful!</h2>
            <p className="text-sm text-gray-500 mt-1">Redirecting to your dashboard...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={40} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900">Login failed</h2>
            <p className="text-sm text-gray-500 mt-1">{errorMsg}</p>
            <a href="/portal/auth" className="inline-block mt-4 text-amber-600 text-sm font-medium hover:underline">
              Try again
            </a>
          </>
        )}
      </div>
    </div>
  );
}
