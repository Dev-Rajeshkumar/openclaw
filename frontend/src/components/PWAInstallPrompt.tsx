'use client';
import { useEffect, useState, useCallback } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show on mobile/tablet (not on desktop where browser handles it)
    const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Check if already dismissed
    if (localStorage.getItem(DISMISS_KEY) === 'true') return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Also show a delayed prompt if no beforeinstallprompt fired (e.g. some Android browsers)
  useEffect(() => {
    const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);
    if (!isMobile) return;
    if (localStorage.getItem(DISMISS_KEY) === 'true') return;
    if (deferredPrompt) return;

    const timer = setTimeout(() => {
      // Only show if still no deferred prompt and not dismissed
      setVisible(true);
    }, 30000); // Show after 30s of browsing

    return () => clearTimeout(timer);
  }, [deferredPrompt]);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      // No deferred prompt — user can still add to home screen manually
      // Just dismiss the prompt
      localStorage.setItem(DISMISS_KEY, 'true');
      setVisible(false);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-16 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
          <span className="text-xl">🐝</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Install BillingBee</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Get the full experience with quick access from your home screen.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition"
            >
              <Download size={13} /> Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
