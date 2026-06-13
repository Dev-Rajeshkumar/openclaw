import { Metadata } from 'next';
import Link from 'next/link';
import { api, Post } from '@/lib/api';

interface PageProps {
  searchParams: Promise<{
    tag?: string;
    category?: string;
    q?: string;
    page?: string;
    sort?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const tag = params.tag;
  return {
    title: tag ? `Posts tagged "${tag}" — CMS Platform` : 'Blog — CMS Platform',
    description: 'Browse all blog posts, tutorials, and articles.',
  };
}

async function getPosts(params: { tag?: string; category?: string; page?: string; sort?: string }) {
  try {
    const res = await api.getPosts({
      page: params.page ? parseInt(params.page, 10) : 1,
      pageSize: 12,
      tag: params.tag,
      category: params.category,
    });
    return res;
  } catch {
    return { data: [], meta: { pagination: { page: 1, pageCount: 1, total: 0 } } };
  }
}

async function getTags() {
  try {
    const res = await api.getTags();
    return res.data || [];
  } catch {
    return [];
  }
}

async function getCategories() {
  try {
    const res = await api.getCategories();
    return res.data || [];
  } catch {
    return [];
  }
}

export const revalidate = 60;

export default async function PostsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [{ data: posts, meta }, tags, categories] = await Promise.all([
    getPosts(params),
    getTags(),
    getCategories(),
  ]);

  const currentPage = meta?.pagination?.page || 1;
  const totalPages = meta?.pagination?.pageCount || 1;
  const total = meta?.pagination?.total || 0;
  const activeTag = params.tag || '';
  const activeCategory = params.category || '';
  const searchQuery = params.q || '';
  const sort = params.sort || 'date';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Blog</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {total} posts and counting
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:w-64 flex-shrink-0 space-y-6">
          {/* Search */}
          <div>
            <label htmlFor="blog-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="blog-search"
                type="text"
                placeholder="Search posts..."
                defaultValue={searchQuery}
                className="input pl-10 text-sm"
              />
            </div>
          </div>

          {/* Sort */}
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort By</label>
            <select id="sort" defaultValue={sort} className="input text-sm">
              <option value="date">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="reading-time">Reading Time</option>
            </select>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Categories</h3>
              <div className="space-y-1">
                <Link
                  href="/posts"
                  className={`block text-sm px-2 py-1 rounded-md transition-colors ${
                    !activeCategory
                      ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  All Categories
                </Link>
                {categories.map((cat: { slug: string; name: string }) => (
                  <Link
                    key={cat.slug}
                    href={`/posts?category=${cat.slug}`}
                    className={`block text-sm px-2 py-1 rounded-md transition-colors ${
                      activeCategory === cat.slug
                        ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag: { slug: string; name: string }) => (
                  <Link
                    key={tag.slug}
                    href={`/posts?tag=${tag.slug}`}
                    className={`text-xs px-2 py-1 rounded-full transition-colors ${
                      activeTag === tag.slug
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {(activeTag || activeCategory || searchQuery) && (
            <Link
              href="/posts"
              className="text-sm text-primary-600 hover:underline inline-flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear all filters
            </Link>
          )}
        </aside>

        {/* Posts Grid */}
        <div className="flex-1">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <h2 className="text-xl font-semibold mb-2">No posts found</h2>
              <p className="text-gray-500">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <article key={post.id} className="card overflow-hidden hover:shadow-lg transition-shadow group">
                  {post.featuredImage && (
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL || ''}${post.featuredImage.url}`}
                        alt={post.featuredImage.alternativeText || post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex gap-2 mb-2 flex-wrap">
                      {post.categories?.slice(0, 2).map((cat) => (
                        <Link
                          key={cat.slug}
                          href={`/posts?category=${cat.slug}`}
                          className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                    <h2 className="text-lg font-semibold mb-2 line-clamp-2">
                      <Link href={`/posts/${post.slug}`} className="hover:underline">
                        {post.title}
                      </Link>
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {post.author && <span>{post.author.username}</span>}
                      <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                      <span>{post.readingTimeMinutes} min</span>
                      <span>{post.viewCount} views</span>
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex gap-1.5 mt-3 flex-wrap">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Link
                            key={tag.slug}
                            href={`/posts?tag=${tag.slug}`}
                            className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                          >
                            #{tag.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Link
                href={`/posts?page=${Math.max(1, currentPage - 1)}&tag=${activeTag}&category=${activeCategory}&q=${searchQuery}&sort=${sort}`}
                className={`btn-ghost text-sm ${currentPage === 1 ? 'opacity-50 pointer-events-none' : ''}`}
              >
                ← Previous
              </Link>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Link
                    key={page}
                    href={`/posts?page=${page}&tag=${activeTag}&category=${activeCategory}&q=${searchQuery}&sort=${sort}`}
                    className={`w-8 h-8 flex items-center justify-center rounded-md text-sm ${
                      currentPage === page
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {page}
                  </Link>
                );
              })}
              <Link
                href={`/posts?page=${Math.min(totalPages, currentPage + 1)}&tag=${activeTag}&category=${activeCategory}&q=${searchQuery}&sort=${sort}`}
                className={`btn-ghost text-sm ${currentPage === totalPages ? 'opacity-50 pointer-events-none' : ''}`}
              >
                Next →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
