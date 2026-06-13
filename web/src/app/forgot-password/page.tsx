import { Metadata } from 'next';
import Link from 'next/link';
import ForgotPasswordForm from './ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot Password — CMS Platform',
  description: 'Reset your CMS Platform password.',
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            <span className="text-primary-600">CMS</span>
            <span className="text-gray-900 dark:text-gray-100">Platform</span>
          </Link>
          <h1 className="text-2xl font-bold mt-4">Reset your password</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {/* Form Card */}
        <div className="card p-8">
          <ForgotPasswordForm />

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-primary-600 hover:underline inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
