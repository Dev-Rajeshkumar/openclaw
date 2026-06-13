/**
 * Admin Analytics Dashboard
 * 
 * Shows overview cards, charts, and detailed post analytics.
 * Accessible only to admin users.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { AnalyticsService } from '@/lib/analytics-service';

// Force dynamic rendering (admin page, needs fresh data)
export const dynamic = 'force-dynamic';

async function DashboardContent() {
  const service = new AnalyticsService();
  let data;
  try {
    data = await service.getDashboard();
  } catch (error) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold mb-2">Unable to load analytics</h2>
        <p className="text-gray-500">Make sure the database is running and Prisma is set up.</p>
        <p className="text-sm text-gray-400 mt-2">Run: npx prisma db push</p>
      </div>
    );
  }

  const { totals, topPosts, subscriberGrowth, viewsOverTime } = data;

  return (
    <div className="space-y-8">
      {/* ── Overview Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <OverviewCard label="Total Views" value={totals.views.toLocaleString()} icon="👁" />
        <OverviewCard label="Unique Visitors" value={totals.uniqueViews.toLocaleString()} icon="👤" />
        <OverviewCard label="Comments" value={totals.comments.toLocaleString()} icon="💬" />
        <OverviewCard label="Reactions" value={totals.reactions.toLocaleString()} icon="❤️" />
        <OverviewCard label="Shares" value={totals.shares.toLocaleString()} icon="🔗" />
        <OverviewCard label="Subscribers" value={totals.subscribers.toLocaleString()} icon="📧" />
        <OverviewCard label="Newsletters" value={totals.newsletters.toLocaleString()} icon="📰" />
      </div>

      {/* ── Views Over Time ────────────────────────────────── */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Views Over Time (Last 30 Days)</h2>
        {viewsOverTime.length > 0 ? (
          <div className="h-64 flex items-end gap-1">
            {viewsOverTime.map((day) => {
              const maxViews = Math.max(...viewsOverTime.map(d => d.views), 1);
              const height = (day.views / maxViews) * 100;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1" title={`${day.date}: ${day.views} views`}>
                  <div
                    className="w-full bg-primary-500 rounded-t-sm min-h-[2px] hover:bg-primary-600 transition-colors"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-gray-400 rotate-45 origin-left">
                    {day.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No view data yet</p>
        )}
      </div>

      {/* ── Top Posts ──────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Top Posts by Views</h2>
          <Link href="/dashboard/posts" className="text-sm text-primary-600 hover:underline">
            View All Analytics →
          </Link>
        </div>
        {topPosts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Post</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Views</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Published</th>
                </tr>
              </thead>
              <tbody>
                {topPosts.map((post) => (
                  <tr key={post.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-2 px-3">
                      <Link href={`/posts/${post.slug}`} className="hover:underline font-medium">
                        {post.title}
                      </Link>
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">{post.views.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-gray-500">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No published posts yet</p>
        )}
      </div>

      {/* ── Subscriber Growth ──────────────────────────────── */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Subscriber Growth</h2>
        {subscriberGrowth.length > 0 ? (
          <div className="h-48 flex items-end gap-2">
            {subscriberGrowth.reverse().map((month) => {
              const maxCount = Math.max(...subscriberGrowth.map(m => m.count), 1);
              const height = (month.count / maxCount) * 100;
              return (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-1" title={`${month.month}: ${month.count} subscribers`}>
                  <div
                    className="w-full bg-green-500 rounded-t-sm min-h-[2px] hover:bg-green-600 transition-colors"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-gray-400">{month.month.slice(5)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No subscribers yet</p>
        )}
      </div>
    </div>
  );
}

function OverviewCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Overview of your content performance
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/posts" className="btn-secondary">
            Post Analytics
          </Link>
          <Link href="/dashboard/newsletters" className="btn-secondary">
            Newsletters
          </Link>
        </div>
      </div>

      {/* Content */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-4 h-24 bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
      <div className="card p-6 h-80 bg-gray-100 dark:bg-gray-800" />
      <div className="card p-6 h-64 bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}
