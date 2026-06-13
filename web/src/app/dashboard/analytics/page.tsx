import { Suspense } from 'react';
import { AnalyticsService } from '@/lib/analytics-service';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface SearchParams {
  from?: string;
  to?: string;
}

async function AnalyticsContent({ from, to }: { from?: string; to?: string }) {
  const service = new AnalyticsService();
  let data;
  try {
    data = await service.getDashboard({
      dateFrom: from ? new Date(from) : undefined,
      dateTo: to ? new Date(to) : undefined,
    });
  } catch (error) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold mb-2">Unable to load analytics</h2>
        <p className="text-gray-500">Make sure the database is running and Prisma is set up.</p>
      </div>
    );
  }

  const { totals, topPosts, subscriberGrowth, viewsOverTime } = data;

  const maxViews = Math.max(...viewsOverTime.map((d) => d.views), 1);
  const maxSubs = Math.max(...subscriberGrowth.map((m) => m.count), 1);

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Views', value: totals.views, icon: '👁', color: 'text-blue-600' },
          { label: 'Unique Visitors', value: totals.uniqueViews, icon: '👤', color: 'text-purple-600' },
          { label: 'Comments', value: totals.comments, icon: '💬', color: 'text-green-600' },
          { label: 'Reactions', value: totals.reactions, icon: '❤️', color: 'text-red-600' },
          { label: 'Shares', value: totals.shares, icon: '🔗', color: 'text-orange-600' },
          { label: 'Subscribers', value: totals.subscribers, icon: '📧', color: 'text-teal-600' },
          { label: 'Newsletters', value: totals.newsletters, icon: '📰', color: 'text-indigo-600' },
        ].map((card) => (
          <div key={card.label} className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{card.icon}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{card.label}</span>
            </div>
            <p className={`text-2xl font-bold tabular-nums ${card.color}`}>
              {card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Views Over Time Chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Views Over Time (Last 30 Days)</h2>
          <button className="btn-ghost text-xs" onClick={() => {
            const csv = viewsOverTime.map((d) => `${d.date},${d.views}`).join('\n');
            const blob = new Blob([`Date,Views\n${csv}`], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'views.csv'; a.click();
          }}>
            Export CSV
          </button>
        </div>
        {viewsOverTime.length > 0 ? (
          <div className="h-64 flex items-end gap-1">
            {viewsOverTime.map((day) => {
              const height = (day.views / maxViews) * 100;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group" title={`${day.date}: ${day.views} views`}>
                  <div className="w-full bg-primary-500 rounded-t-sm min-h-[2px] group-hover:bg-primary-600 transition-colors relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {day.views} views
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 rotate-45 origin-left">{day.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No view data yet</p>
        )}
      </div>

      {/* Content Decay Alerts */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Content Decay Alerts</h2>
        {topPosts.length > 0 ? (
          <div className="space-y-3">
            {topPosts.slice(0, 5).map((post) => {
              const daysSincePublished = post.publishedAt
                ? Math.floor((Date.now() - new Date(post.publishedAt).getTime()) / (1000 * 60 * 60 * 24))
                : 0;
              const isStale = daysSincePublished > 90;

              return (
                <div key={post.id} className={`flex items-center justify-between p-3 rounded-lg ${isStale ? 'bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                  <div className="flex-1 min-w-0">
                    <Link href={`/posts/${post.slug}`} className="font-medium hover:underline truncate block">
                      {post.title}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {daysSincePublished} days old · {post.views.toLocaleString()} views
                    </p>
                  </div>
                  {isStale && (
                    <span className="ml-3 px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-full">
                      Needs Update
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No posts to analyze</p>
        )}
      </div>

      {/* Top Posts Table */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Top Posts by Views</h2>
          <button className="btn-ghost text-xs">Export CSV</button>
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
                      <Link href={`/posts/${post.slug}`} className="hover:underline font-medium">{post.title}</Link>
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

      {/* Subscriber Growth */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Subscriber Growth</h2>
        {subscriberGrowth.length > 0 ? (
          <div className="h-48 flex items-end gap-2">
            {[...subscriberGrowth].reverse().map((month) => {
              const height = (month.count / maxSubs) * 100;
              return (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-1" title={`${month.month}: ${month.count} subscribers`}>
                  <div className="w-full bg-green-500 rounded-t-sm min-h-[2px] hover:bg-green-600 transition-colors" style={{ height: `${height}%` }} />
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

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Deep insights into your content performance
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/analytics?from=${new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)}" className="btn-ghost text-sm">7d</Link>
          <Link href="/dashboard/analytics?from=${new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)}" className="btn-ghost text-sm">30d</Link>
          <Link href="/dashboard/analytics?from=${new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)}" className="btn-ghost text-sm">90d</Link>
          <Link href="/dashboard/analytics" className="btn-ghost text-sm">All</Link>
        </div>
      </div>

      <Suspense fallback={<div className="space-y-4 animate-pulse"><div className="card p-4 h-24 bg-gray-100 dark:bg-gray-800" /><div className="card p-6 h-80 bg-gray-100 dark:bg-gray-800" /></div>}>
        <AnalyticsContent from={params.from} to={params.to} />
      </Suspense>
    </div>
  );
}
