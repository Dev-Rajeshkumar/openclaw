import { Metadata } from 'next';
import Link from 'next/link';
import { api } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Posts — Dashboard',
};

export const dynamic = 'force-dynamic';

interface SearchParams {
  search?: string;
  status?: string;
  page?: string;
}

async function getPosts(params: SearchParams) {
  try {
    const res = await api.getPosts({
      page: params.page ? parseInt(params.page, 10) : 1,
      pageSize: 20,
    });
    return res;
  } catch {
    return { data: [], meta: { pagination: { page: 1, pageCount: 1, total: 0 } } };
  }
}

export default async function DashboardPostsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const { data: posts, meta } = await getPosts(params);
  const currentPage = meta?.pagination?.page || 1;
  const totalPages = meta?.pagination?.pageCount || 1;
  const total = meta?.pagination?.total || 0;

  const statuses = ['Published', 'Draft', 'Archived'];
  const currentStatus = params.status || 'All';
  const searchQuery = params.search || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Posts</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{total} total posts</p>
        </div>
        <Link href="/dashboard/posts/new" className="btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search posts..."
              defaultValue={searchQuery}
              className="input pl-10"
              name="search"
              form="filter-form"
            />
          </div>

          {/* Status Filter */}
          <select
            name="status"
            defaultValue={currentStatus}
            className="input sm:w-40"
            form="filter-form"
            aria-label="Filter by status"
          >
            <option value="All">All Status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <form id="filter-form" method="GET">
            <button type="submit" className="btn-secondary">Filter</button>
          </form>
        </div>
      </div>

      {/* Posts Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Title</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 hidden sm:table-cell">Status</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 hidden md:table-cell">Views</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 hidden lg:table-cell">Date</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    No posts found.{' '}
                    <Link href="/dashboard/posts/new" className="text-primary-600 hover:underline">
                      Create your first post
                    </Link>
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {post.featuredImage && (
                          <div className="w-10 h-10 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL || ''}${post.featuredImage.url}`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link href={`/posts/${post.slug}`} className="font-medium hover:underline truncate block">
                            {post.title}
                          </Link>
                          <p className="text-xs text-gray-500 truncate">
                            {post.author?.username || 'Unknown'} · {post.readingTimeMinutes}min
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        post.publishedAt
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                          : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                      }`}>
                        {post.publishedAt ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-500 hidden md:table-cell tabular-nums">
                      {post.viewCount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-500 hidden lg:table-cell">
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/posts/edit/${post.id}`}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-primary-600"
                          aria-label={`Edit ${post.title}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600"
                          aria-label={`Delete ${post.title}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-1">
              <Link
                href={`/dashboard/posts?page=${Math.max(1, currentPage - 1)}&status=${currentStatus}&search=${searchQuery}`}
                className={`btn-ghost text-sm px-3 py-1.5 ${currentPage === 1 ? 'opacity-50 pointer-events-none' : ''}`}
              >
                Previous
              </Link>
              <Link
                href={`/dashboard/posts?page=${Math.min(totalPages, currentPage + 1)}&status=${currentStatus}&search=${searchQuery}`}
                className={`btn-ghost text-sm px-3 py-1.5 ${currentPage === totalPages ? 'opacity-50 pointer-events-none' : ''}`}
              >
                Next
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
