'use client';

import { useState, useEffect, useCallback } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  contentRef?: React.RefObject<HTMLElement | null>;
}

export function TableOfContents({ contentRef }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  // Extract headings from content
  useEffect(() => {
    if (contentRef?.current) {
      const headingElements = contentRef.current.querySelectorAll('h2, h3, h4');
      const items: TocItem[] = Array.from(headingElements)
        .filter((el) => el.textContent)
        .map((el, index) => ({
          id: el.id || `heading-${index}`,
          text: el.textContent || '',
          level: parseInt(el.tagName.charAt(1), 10),
        }));

      // Ensure IDs exist for intersection observer
      headingElements.forEach((el, index) => {
        if (!el.id) el.id = `heading-${index}`;
      });

      setHeadings(items);
    }
  }, [contentRef]);

  // Track active heading with IntersectionObserver
  useEffect(() => {
    if (headings.length === 0 || !contentRef?.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          // Pick the topmost visible heading
          const topEntry = visible.reduce((a, b) =>
            a.boundingClientRect.top < b.boundingClientRect.top ? a : b
          );
          setActiveId(topEntry.target.id);
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0.1,
      }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings, contentRef]);

  const scrollToHeading = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 100;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
      setActiveId(id);
    }
  }, []);

  if (headings.length < 2) return null;

  return (
    <nav aria-label="Table of contents" className="hidden xl:block">
      {/* Mobile/Tablet Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="xl:hidden mb-4 flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600"
        aria-expanded={isOpen}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        Table of Contents
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Desktop: always visible sidebar */}
      <div className={`${isOpen ? 'block' : 'hidden'} xl:block sticky top-24`}>
        <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-4 max-h-[70vh] overflow-y-auto">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">On this page</p>
          <ul className="space-y-1.5">
            {headings.map((heading) => (
              <li key={heading.id}>
                <button
                  onClick={() => scrollToHeading(heading.id)}
                  className={`
                    text-sm text-left transition-colors duration-150 truncate max-w-[200px]
                    ${heading.level === 3 ? 'pl-3' : heading.level === 4 ? 'pl-6' : ''}
                    ${activeId === heading.id
                      ? 'text-primary-600 dark:text-primary-400 font-medium'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }
                  `}
                  title={heading.text}
                >
                  {heading.text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
