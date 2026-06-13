'use client';

import { useState, useCallback } from 'react';

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

interface SharePlatform {
  name: string;
  icon: React.ReactNode;
  color: string;
  buildUrl: (params: { url: string; title: string; description?: string }) => string;
}

const platforms: SharePlatform[] = [
  {
    name: 'Twitter',
    color: 'hover:bg-sky-50 dark:hover:bg-sky-950 hover:text-sky-600 hover:border-sky-300',
    buildUrl: ({ url, title }) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: 'Facebook',
    color: 'hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 hover:border-blue-300',
    buildUrl: ({ url }) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    color: 'hover:bg-sky-50 dark:hover:bg-sky-950 hover:text-sky-700 hover:border-sky-300',
    buildUrl: ({ url, title, description }) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description || '')}`,
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    name: 'Reddit',
    color: 'hover:bg-orange-50 dark:hover:bg-orange-950 hover:text-orange-600 hover:border-orange-300',
    buildUrl: ({ url, title }) =>
      `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </svg>
    ),
  },
  {
    name: 'Hacker News',
    color: 'hover:bg-orange-50 dark:hover:bg-orange-950 hover:text-orange-500 hover:border-orange-300',
    buildUrl: ({ url, title }) =>
      `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(url)}&t=${encodeURIComponent(title)}`,
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M0 0v24h24V0H0zm11.5 13.5h-2V8h2v5.5zm4 0h-2V8h2v5.5z" />
      </svg>
    ),
  },
];

export function ShareButtons({ url, title, description, className = '' }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [shareCount, setShareCount] = useState<number | null>(null);

  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;

  const handleShare = useCallback((platform: SharePlatform) => {
    const shareUrl = platform.buildUrl({ url: fullUrl, title, description });
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
    setShareCount((prev) => (prev || 0) + 1);
  }, [fullUrl, title, description]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = fullUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [fullUrl]);

  return (
    <div className={`space-y-3 ${className}`}>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Share this post</p>
      <div className="flex flex-wrap gap-2">
        {platforms.map((platform) => (
          <button
            key={platform.name}
            onClick={() => handleShare(platform)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400
              transition-all duration-200 ${platform.color}`}
            aria-label={`Share on ${platform.name}`}
          >
            {platform.icon}
            <span className="hidden sm:inline">{platform.name}</span>
          </button>
        ))}
        <button
          onClick={handleCopyLink}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
            border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400
            transition-all duration-200
            ${copied
              ? 'bg-green-50 dark:bg-green-950 text-green-600 border-green-300'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          aria-label={copied ? 'Link copied!' : 'Copy link'}
        >
          {copied ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
          <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      {shareCount !== null && shareCount > 0 && (
        <p className="text-xs text-gray-400">{shareCount} share{shareCount !== 1 ? 's' : ''}</p>
      )}
    </div>
  );
}
