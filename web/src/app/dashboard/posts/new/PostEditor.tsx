'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function PostEditor() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [tags, setTags] = useState('');
  const [categories, setCategories] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleSave = useCallback(async (publishStatus: 'draft' | 'published') => {
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          excerpt,
          seoTitle: seoTitle || title,
          seoDescription: seoDescription || excerpt,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          categories: categories.split(',').map((c) => c.trim()).filter(Boolean),
          status: publishStatus,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save post');
      }

      const data = await res.json();
      router.push('/dashboard/posts');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
    }

    setSaving(false);
  }, [title, content, excerpt, seoTitle, seoDescription, tags, categories, router]);

  const handleAiGenerate = useCallback(async () => {
    if (!title.trim()) {
      setError('Enter a title first to generate content with AI');
      return;
    }
    setAiGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type: 'content' }),
      });

      if (!res.ok) throw new Error('AI generation failed');

      const data = await res.json();
      if (data.content) setContent(data.content);
      if (data.excerpt) setExcerpt(data.excerpt);
      if (data.seoDescription) setSeoDescription(data.seoDescription);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI generation failed');
    }

    setAiGenerating(false);
  }, [title]);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Editor */}
      <div className="lg:col-span-2 space-y-4">
        {error && (
          <div className="p-3 rounded-md bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800" role="alert">
            {error}
          </div>
        )}

        {/* Title */}
        <div className="card p-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title..."
            className="w-full text-2xl font-bold bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-gray-400"
            aria-label="Post title"
          />
        </div>

        {/* Content Editor */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="content" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Content
            </label>
            <button
              type="button"
              onClick={handleAiGenerate}
              disabled={aiGenerating || !title.trim()}
              className="text-xs inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 border border-purple-200 dark:border-purple-800 disabled:opacity-50"
            >
              {aiGenerating ? (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI Generate
                </>
              )}
            </button>
          </div>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post content here... (Markdown supported)"
            rows={20}
            className="input font-mono text-sm resize-y min-h-[400px]"
            aria-label="Post content"
          />
        </div>

        {/* Excerpt */}
        <div className="card p-4">
          <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="A brief summary of your post..."
            rows={3}
            className="input resize-y"
          />
        </div>

        {/* SEO Fields */}
        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">SEO Settings</h3>
          <div>
            <label htmlFor="seo-title" className="block text-xs font-medium text-gray-500 mb-1">SEO Title</label>
            <input
              id="seo-title"
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder={title || 'SEO title (defaults to post title)'}
              className="input text-sm"
              maxLength={60}
            />
            <p className="text-xs text-gray-400 mt-1">{seoTitle.length}/60 characters</p>
          </div>
          <div>
            <label htmlFor="seo-description" className="block text-xs font-medium text-gray-500 mb-1">Meta Description</label>
            <textarea
              id="seo-description"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Meta description for search engines..."
              rows={2}
              className="input text-sm resize-y"
              maxLength={160}
            />
            <p className="text-xs text-gray-400 mt-1">{seoDescription.length}/160 characters</p>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Publish Settings */}
        <div className="card p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Publish Settings</h3>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus('draft')}
                className={`flex-1 text-sm py-1.5 rounded-md border transition-colors ${
                  status === 'draft'
                    ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                Draft
              </button>
              <button
                type="button"
                onClick={() => setStatus('published')}
                className={`flex-1 text-sm py-1.5 rounded-md border transition-colors ${
                  status === 'published'
                    ? 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                Published
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleSave('draft')}
              disabled={saving || !title.trim()}
              className="btn-secondary flex-1 text-sm"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={() => handleSave('published')}
              disabled={saving || !title.trim() || !content.trim()}
              className="btn-primary flex-1 text-sm"
            >
              {saving ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="card p-4">
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="react, nextjs, tutorial"
            className="input text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
        </div>

        {/* Categories */}
        <div className="card p-4">
          <label htmlFor="categories" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Categories
          </label>
          <input
            id="categories"
            type="text"
            value={categories}
            onChange={(e) => setCategories(e.target.value)}
            placeholder="Technology, Tutorials"
            className="input text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
        </div>

        {/* Featured Image */}
        <div className="card p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Featured Image
          </label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary-400 dark:hover:border-primary-500 transition-colors cursor-pointer">
            <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
          </div>
        </div>
      </div>
    </div>
  );
}
