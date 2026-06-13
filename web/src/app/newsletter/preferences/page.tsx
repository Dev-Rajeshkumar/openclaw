'use client';

import { useState, useCallback } from 'react';

const topics = [
  { id: 'product', label: 'Product Updates', description: 'New features and improvements' },
  { id: 'engineering', label: 'Engineering', description: 'Technical deep-dives and tutorials' },
  { id: 'community', label: 'Community', description: 'Events, highlights, and stories' },
  { id: 'industry', label: 'Industry News', description: 'Trends and analysis' },
];

export default function NewsletterPreferencesPage() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['product', 'engineering']);
  const [frequency, setFrequency] = useState('weekly');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);

  const toggleTopic = useCallback((id: string) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
    setSaved(false);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await fetch('/api/newsletter/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics: selectedTopics, frequency }),
      });
      setSaved(true);
    } catch {
      // handle error
    }
    setSaving(false);
  }, [selectedTopics, frequency]);

  const handleUnsubscribeAll = useCallback(async () => {
    if (!window.confirm('Are you sure you want to unsubscribe from all newsletters?')) return;
    setUnsubscribing(true);
    try {
      await fetch('/api/newsletter/unsubscribe', { method: 'POST' });
      // Redirect or show confirmation
    } catch {
      // handle error
    }
    setUnsubscribing(false);
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Email Preferences</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Customize what you receive and how often
          </p>
        </div>

        <div className="space-y-6">
          {/* Frequency */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Email Frequency</h2>
            <div className="space-y-2">
              {[
                { value: 'daily', label: 'Daily Digest', desc: 'One email per day with the latest content' },
                { value: 'weekly', label: 'Weekly Roundup', desc: 'One email per week with top content' },
                { value: 'monthly', label: 'Monthly Summary', desc: 'One email per month with highlights' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    frequency === option.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="frequency"
                    value={option.value}
                    checked={frequency === option.value}
                    onChange={(e) => { setFrequency(e.target.value); setSaved(false); }}
                    className="mt-0.5 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-gray-500">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Topics */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Topic Interests</h2>
            <div className="space-y-2">
              {topics.map((topic) => (
                <label
                  key={topic.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedTopics.includes(topic.id)}
                    onChange={() => toggleTopic(topic.id)}
                    className="mt-0.5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{topic.label}</p>
                    <p className="text-xs text-gray-500">{topic.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full"
          >
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Preferences'}
          </button>

          {saved && (
            <p className="text-center text-sm text-green-600">Your preferences have been updated.</p>
          )}

          {/* Unsubscribe */}
          <div className="card p-6 border-red-200 dark:border-red-900">
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Unsubscribe</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              If you&apos;d like to stop receiving all emails, you can unsubscribe below.
            </p>
            <button
              onClick={handleUnsubscribeAll}
              disabled={unsubscribing}
              className="btn border-red-300 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            >
              {unsubscribing ? 'Unsubscribing...' : 'Unsubscribe from All'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
