'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
}

const popularTags = ['Next.js', 'React', 'TypeScript', 'AI', 'Analytics', 'Tutorial'];

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cms_recent_searches');
      if (stored) {
        try { setRecentSearches(JSON.parse(stored)); } catch { /* ignore */ }
      }
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const saveRecentSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cms_recent_searches', JSON.stringify(updated));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      onClose();
      router.push(`/posts?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleTagClick = (tag: string) => {
    onClose();
    router.push(`/posts?tag=${encodeURIComponent(tag)}`);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in">
        {/* Search Input */}
        <form onSubmit={handleSubmit} className="flex items-center border-b border-gray-200 dark:border-gray-700">
          <svg className="w-5 h-5 ml-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts, tags, topics..."
            className="flex-1 px-3 py-4 bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none text-lg"
            aria-label="Search query"
          />
          {loading && (
            <div className="mr-4 w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          )}
          <button
            type="button"
            onClick={onClose}
            className="mr-4 px-2 py-1 text-xs text-gray-400 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close search"
          >
            ESC
          </button>
        </form>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim() && results.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Results</p>
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={`/posts/${result.slug}`}
                  onClick={() => { saveRecentSearch(query.trim()); onClose(); }}
                  className="block px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <p className="font-medium text-gray-900 dark:text-gray-100">{result.title}</p>
                  {result.excerpt && (
                    <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{result.excerpt}</p>
                  )}
                </Link>
              ))}
            </div>
          )}

          {query.trim() && !loading && results.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Recent Searches */}
          {!query.trim() && recentSearches.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Recent Searches</p>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => { setQuery(term); saveRecentSearch(term); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">{term}</span>
                </button>
              ))}
            </div>
          )}

          {/* Popular Tags */}
          {!query.trim() && (
            <div className="p-2 border-t border-gray-100 dark:border-gray-800">
              <p className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Popular Tags</p>
              <div className="flex flex-wrap gap-2 px-3 py-2">
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className="text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
