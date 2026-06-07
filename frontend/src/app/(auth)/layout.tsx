import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🐝</span>
            <span className="text-2xl font-bold text-gray-900">BillingBee</span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
