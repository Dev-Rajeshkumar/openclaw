import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Newsletters — Dashboard',
};

export const dynamic = 'force-dynamic';

const mockNewsletters = [
  { id: '1', subject: 'Weekly Digest #42', status: 'sent', sentAt: '2025-01-15', openRate: 42.3, clickRate: 8.1, recipients: 1247 },
  { id: '2', subject: 'New Features Announcement', status: 'scheduled', sentAt: null, openRate: 0, clickRate: 0, recipients: 1302 },
  { id: '3', subject: 'Community Roundup', status: 'draft', sentAt: null, openRate: 0, clickRate: 0, recipients: 0 },
];

const mockSubscribers = [
  { email: 'alice@example.com', name: 'Alice', status: 'confirmed', subscribedAt: '2024-11-01' },
  { email: 'bob@example.com', name: 'Bob', status: 'confirmed', subscribedAt: '2024-12-15' },
  { email: 'charlie@example.com', name: 'Charlie', status: 'pending', subscribedAt: '2025-01-10' },
];

export default function NewslettersPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Newsletters</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage newsletters, campaigns, and subscribers
          </p>
        </div>
        <button className="btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Newsletter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Subscribers</p>
          <p className="text-2xl font-bold mt-1">1,302</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Open Rate</p>
          <p className="text-2xl font-bold mt-1">42.3%</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Click Rate</p>
          <p className="text-2xl font-bold mt-1">8.1%</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active Campaigns</p>
          <p className="text-2xl font-bold mt-1">3</p>
        </div>
      </div>

      {/* Sending Queue */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Sending Queue</h2>
        <div className="space-y-3">
          {mockNewsletters.map((nl) => (
            <div key={nl.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{nl.subject}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                    nl.status === 'sent' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                    nl.status === 'scheduled' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {nl.status}
                  </span>
                  {nl.sentAt && <span>Sent: {nl.sentAt}</span>}
                  {nl.recipients > 0 && <span>{nl.recipients} recipients</span>}
                </div>
              </div>
              {nl.status === 'sent' && (
                <div className="ml-4 text-right text-xs">
                  <p>Open: {nl.openRate}%</p>
                  <p>Click: {nl.clickRate}%</p>
                </div>
              )}
              <div className="ml-3 flex gap-1">
                <Link href={`/dashboard/newsletters/${nl.id}`} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </Link>
                <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscribers */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Subscribers</h2>
          <div className="flex gap-2">
            <button className="btn-secondary text-xs">
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import CSV
            </button>
            <button className="btn-ghost text-xs">Export</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left py-2 px-4 font-medium text-gray-500">Email</th>
                <th className="text-left py-2 px-4 font-medium text-gray-500 hidden sm:table-cell">Name</th>
                <th className="text-left py-2 px-4 font-medium text-gray-500">Status</th>
                <th className="text-right py-2 px-4 font-medium text-gray-500 hidden md:table-cell">Subscribed</th>
                <th className="text-right py-2 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockSubscribers.map((sub) => (
                <tr key={sub.email} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-2 px-4 font-mono text-xs">{sub.email}</td>
                  <td className="py-2 px-4 hidden sm:table-cell">{sub.name}</td>
                  <td className="py-2 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      sub.status === 'confirmed'
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-right text-gray-500 hidden md:table-cell">{sub.subscribedAt}</td>
                  <td className="py-2 px-4 text-right">
                    <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-600" aria-label={`Remove ${sub.email}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Segments */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Segments</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { name: 'All Subscribers', count: 1302, color: 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' },
            { name: 'Active (opened in 30d)', count: 847, color: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' },
            { name: 'Inactive (90d+)', count: 156, color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
          ].map((segment) => (
            <div key={segment.name} className={`p-4 rounded-lg ${segment.color}`}>
              <p className="text-sm font-medium">{segment.name}</p>
              <p className="text-2xl font-bold mt-1">{segment.count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
