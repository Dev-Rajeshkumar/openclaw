'use client';
import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setOffline(!navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-amber-600 text-white text-center py-2 text-sm z-50 flex items-center justify-center gap-2">
      <WifiOff size={14} /> You&apos;re offline. Changes will sync when reconnected.
    </div>
  );
}
