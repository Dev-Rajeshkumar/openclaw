import { Metadata } from 'next';
import Link from 'next/link';
import { SubscribeForm } from '@/components/newsletter/SubscribeForm';

export const metadata: Metadata = {
  title: 'Subscribe to Newsletter — CMS Platform',
  description: 'Subscribe to our newsletter and stay updated with the latest content.',
};

const topics = [
  { id: 'product', label: 'Product Updates', description: 'New features and improvements' },
  { id: 'engineering', label: 'Engineering', description: 'Technical deep-dives and tutorials' },
  { id: 'community', label: 'Community', description: 'Events, highlights, and stories' },
  { id: 'industry', label: 'Industry News', description: 'Trends and analysis' },
];

export default function NewsletterSubscribePage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold">Subscribe to our Newsletter</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Get the best content delivered to your inbox. No spam, ever.
          </p>
        </div>

        {/* Form Card */}
        <div className="card p-8">
          <SubscribeForm />

          {/* Topic Preferences */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Topic Preferences</h3>
            <div className="space-y-2">
              {topics.map((topic) => (
                <label key={topic.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    name="topics"
                    value={topic.id}
                    defaultChecked
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

          {/* Frequency */}
          <div className="mt-4">
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Frequency
            </label>
            <select id="frequency" name="frequency" defaultValue="weekly" className="input text-sm">
              <option value="daily">Daily Digest</option>
              <option value="weekly">Weekly Roundup</option>
              <option value="monthly">Monthly Summary</option>
            </select>
          </div>
        </div>

        {/* Double Opt-in Notice */}
        <p className="text-center text-xs text-gray-500 mt-4">
          By subscribing, you agree to receive emails from us. We use double opt-in confirmation.
          You can unsubscribe at any time. See our{' '}
          <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
