'use client';

import { useState, useEffect } from 'react';

interface ReadingProgressProps {
  contentRef?: React.RefObject<HTMLElement | null>;
}

export function ReadingProgress({ contentRef }: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === 'undefined') return;

      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPct = docHeight > 0 ? Math.min(100, Math.round((scrollTop / docHeight) * 100)) : 0;
      setProgress(scrollPct);
    };

    // Estimate remaining time based on total reading time
    const estimateTimeRemaining = () => {
      if (contentRef?.current) {
        const text = contentRef.current.textContent || '';
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        const wordsPerMinute = 225;
        const totalMinutes = Math.ceil(wordCount / wordsPerMinute);
        const remaining = Math.max(0, Math.ceil(totalMinutes * (1 - progress / 100)));
        setTimeRemaining(remaining);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    estimateTimeRemaining();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [contentRef, progress]);

  return (
    <div className="fixed top-16 left-0 right-0 z-30">
      {/* Progress Bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-800" role="progressbar" aria-label="Reading progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Time Remaining Badge */}
      {timeRemaining !== null && timeRemaining > 0 && progress < 100 && (
        <div className="absolute right-4 top-2 px-2 py-0.5 text-xs font-medium text-gray-500 bg-white/80 dark:bg-gray-900/80 rounded-full shadow-sm backdrop-blur-sm">
          {timeRemaining} min left
        </div>
      )}

      {progress >= 100 && (
        <div className="absolute right-4 top-2 px-2 py-0.5 text-xs font-medium text-green-600 bg-green-50/80 dark:bg-green-950/80 rounded-full shadow-sm backdrop-blur-sm">
          ✓ Complete
        </div>
      )}
    </div>
  );
}
