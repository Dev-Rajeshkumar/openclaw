'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FileText, LogOut, Loader2 } from 'lucide-react';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [client, setClient] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  // Auth pages that don't need login
  const isAuthPage = pathname.startsWith('/portal/auth');

  useEffect(() => {
    if (isAuthPage) { setChecking(false); return; }

    const token = localStorage.getItem('client_token');
    const info = localStorage.getItem('client_info');
    if (!token) {
      router.push('/portal/auth');
      return;
    }
    if (info) setClient(JSON.parse(info));
    setChecking(false);
  }, [isAuthPage, router]);

  const handleLogout = () => {
    localStorage.removeItem('client_token');
    localStorage.removeItem('client_info');
    router.push('/portal/auth');
  };

  if (checking && !isAuthPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-amber-500" />
      </div>
    );
  }

  // Auth pages — no header
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-amber-500" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm">{client?.businessName || 'Client Portal'}</h1>
              <p className="text-xs text-gray-500">{client?.name}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
