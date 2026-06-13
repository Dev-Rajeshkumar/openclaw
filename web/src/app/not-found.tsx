import Link from 'next/link';

const popularPosts = [
  { title: 'Getting Started with CMS Platform', slug: 'getting-started' },
  { title: 'AI-Powered Content Creation Guide', slug: 'ai-content-guide' },
  { title: 'Understanding Analytics Dashboard', slug: 'analytics-guide' },
  { title: 'Multi-Locale Content Strategy', slug: 'multi-locale-strategy' },
];

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <span className="text-8xl font-bold text-gray-200 dark:text-gray-800">404</span>
        </div>

        <h1 className="text-3xl font-bold mb-3">Page not found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or doesn&apos;t exist.
        </p>

        {/* Search */}
        <div className="mb-8">
          <form action="/posts" method="GET" className="flex gap-2 max-w-sm mx-auto">
            <input
              type="text"
              name="q"
              placeholder="Search posts..."
              className="input flex-1"
              aria-label="Search"
            />
            <button type="submit" className="btn-primary">
              Search
            </button>
          </form>
        </div>

        {/* Popular Posts */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Popular Posts</h2>
          <div className="space-y-2">
            {popularPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/posts/${post.slug}`}
                className="block text-sm text-primary-600 hover:underline"
              >
                {post.title}
              </Link>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
          <Link href="/posts" className="btn-secondary">
            Browse Blog
          </Link>
        </div>
      </div>
    </div>
  );
}
