'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, LoginFormData } from '@/lib/validations';
import { cn } from '@/lib/utils';
import GoogleLoginButton from '@/components/GoogleLoginButton';

export default function LoginPage() {
  const router = useRouter();
  const { login, googleLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try { await login(data.email, data.password); toast.success('Welcome back!'); router.push('/dashboard'); }
    catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Login failed'); }
    finally { setIsSubmitting(false); }
  };

  const handleGoogleSuccess = async (idToken: string) => {
    try { await googleLogin(idToken); toast.success('Welcome!'); router.push('/dashboard'); }
    catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Google login failed'); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-gray-500 mt-1">Sign in to your BillingBee account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input id="email" type="email" placeholder="you@example.com" {...register('email')}
            className={cn('w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition', errors.email ? 'border-red-300' : 'border-gray-200')} />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div className="relative">
            <input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" {...register('password')}
              className={cn('w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition pr-12', errors.password ? 'border-red-300' : 'border-gray-200')} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
          {isSubmitting ? <><Loader2 size={20} className="animate-spin" />Signing in...</> : 'Sign In'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-sm text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <GoogleLoginButton
        onSuccess={handleGoogleSuccess}
        onError={(error) => toast.error(error)}
      />

      <div className="mt-6 text-center">
        <p className="text-gray-500">Don't have an account?{' '}
          <Link href="/auth/register" className="text-amber-600 hover:text-amber-700 font-medium">Sign up free</Link>
        </p>
      </div>
    </div>
  );
}
