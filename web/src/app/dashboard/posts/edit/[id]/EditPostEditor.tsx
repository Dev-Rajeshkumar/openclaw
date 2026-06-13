'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface VersionEntry {
  id: string;
  title: string;
  updatedAt: string;
  status: string;
}

interface EditPostEditorProps {
  postId: string;
}

export default function EditPostEditor({ postId }: EditPostEditorProps) {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<VersionEntry[]>([]);

  // Load post data
  useEffect(() => {
    fetch(`/api/posts/${postId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setTitle(data.data.title || '');
          setContent(data.data.content || '');
          setExcerpt(data.data.excerpt || '');
          setSeoTitle(data.data.seoTitle || '');
          setSeoDescription(data.data.seoDescription || '');
          setTags((data.data.tags || []).map((t: { name: string }) => t.name).join(', '));
          setCategories((data.data.categories || []).map((c: { name: string }) => c.name).join(', '));
          setStatus(data.data.publishedAt ? 'published' : 'draft');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load post');
        setLoading(false);
      });

  }, [postId]);

  const handleSave = useCallback(async (publishStatus: 'draft' | 'published') => {
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
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
        throw new Error(data.error || 'Failed to update post');
      }

      router.push('/dashboard/posts');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
    }

    setSaving(false);
  }, [postId, title, content, excerpt, seoTitle, seoDescription, tags, categories, router]);

  const handleRestoreVersion = useCallback((versionId: string) => {
    // In a real app, this would fetch the version content
    setShowVersions(false);
    setError('');
    // Placeholder: would restore version content
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="card p-4 h-14 bg-gray-100 dark:bg-gray-800" />
        <div className="card p-4 h-96 bg-gray-100 dark:bg-gray-800" />
        <div className="card p-4 h-48 bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

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

        {/* Content */}
        <div className="card p-4">
          <label htmlFor="edit-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content
          </label>
          <textarea
            id="edit-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Post content..."
            rows={20}
            className="input font-mono text-sm resize-y min-h-[400px]"
            aria-label="Post content"
          />
        </div>

        {/* Excerpt */}
        <div className="card p-4">
          <label htmlFor="edit-excerpt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Excerpt</label>
          <textarea id="edit-excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} className="input resize-y" />
        </div>

        {/* SEO */}
        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-semibold">SEO Settings</h3>
          <div>
            <label htmlFor="edit-seo-title" className="block text-xs font-medium text-gray-500 mb-1">SEO Title</label>
            <input id="edit-seo-title" type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className="input text-sm" maxLength={60} />
          </div>
          <div>
            <label htmlFor="edit-seo-desc" className="block text-xs font-medium text-gray-500 mb-1">Meta Description</label>
            <textarea id="edit-seo-desc" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={2} className="input text-sm resize-y" maxLength={160} />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Publish */}
        <div className="card p-4 space-y-4">
          <h3 className="text-sm font-semibold">Publish Settings</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStatus('draft')}
              className={`flex-1 text-sm py-1.5 rounded-md border transition-colors ${
                status === 'draft'
                  ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700 text-yellow-700'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >Draft</button>
            <button
              type="button"
              onClick={() => setStatus('published')}
              className={`flex-1 text-sm py-1.5 rounded-md border transition-colors ${
                status === 'published'
                  ? 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700 text-green-700'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >Published</button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleSave('draft')} disabled={saving || !title.trim()} className="btn-secondary flex-1 text-sm">
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button onClick={() => handleSave('published')} disabled={saving || !title.trim() || !content.trim()} className="btn-primary flex-1 text-sm">
              {saving ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>

        {/* Version History */}
        <div className="card p-4">
          <button
            onClick={() => setShowVersions(!showVersions)}
            className="flex items-center justify-between w-full text-sm font-semibold"
          >
            <span>Version History</span>
            <svg className={`w-4 h-4 transition-transform ${showVersions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showVersions && (
            <div className="mt-3 space-y-2">
              {versions.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No version history available</p>
              ) : (
                versions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-xs">
                    <div>
                      <p className="font-medium">{v.title}</p>
                      <p className="text-gray-500">{new Date(v.updatedAt).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => handleRestoreVersion(v.id)}
                      className="text-primary-600 hover:underline"
                    >
                      Restore
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Tags & Categories */}
        <div className="card p-4">
          <label htmlFor="edit-tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
          <input id="edit-tags" type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="input text-sm" />
        </div>
        <div className="card p-4">
          <label htmlFor="edit-categories" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categories</label>
          <input id="edit-categories" type="text" value={categories} onChange={(e) => setCategories(e.target.value)} className="input text-sm" />
        </div>

        {/* Featured Image */}
        <div className="card p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Featured Image</label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary-400 transition-colors cursor-pointer">
            <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-500">Upload image</p>
          </div>
        </div>
      </div>
    </div>
  );
}
