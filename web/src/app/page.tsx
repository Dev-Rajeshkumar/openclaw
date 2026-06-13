import Link from 'next/link';
import { api, Post } from '@/lib/api';

export const revalidate = 60; // ISR: revalidate every 60 seconds

async function getFeaturedPosts(): Promise<Post[]> {
  try {
    const res = await api.getFeaturedPosts();
    return res.data || [];
  } catch {
    return [];
  }
}

async function getRecentPosts(): Promise<Post[]> {
  try {
    const res = await api.getPosts({ pageSize: 10 });
    return res.data || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [featured, recent] = await Promise.all([getFeaturedPosts(), getRecentPosts()]);

  return (
    <main>
      {/* ── Hero Section ──────────────────────────────────── */}
      <section className="bg-gradient-to-b from-primary-50 to-surface dark:from-primary-950 dark:to-surface-dark py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-balance mb-4">
            Modern CMS Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            AI-powered content creation, deep analytics, multi-language support — 100% free and open-source.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/posts" className="btn-primary text-lg px-6 py-3">
              Read Blog
            </Link>
            <Link href="/login" className="btn-secondary text-lg px-6 py-3">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured Posts ─────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold mb-8">Featured Posts</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((post) => (
              <article key={post.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
                {post.featuredImage && (
                  <div className="aspect-video bg-gray-200 dark:bg-gray-700">
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}${post.featuredImage.url}`}
                      alt={post.featuredImage.alternativeText || post.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex gap-2 mb-2">
                    {post.tags?.slice(0, 2).map((tag) => (
                      <span key={tag.slug} className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                    <Link href={`/posts/${post.slug}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    {post.author && <span>{post.author.username}</span>}
                    <span>{post.readingTimeMinutes} min read</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── Recent Posts ──────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8">Recent Posts</h2>
        <div className="space-y-8">
          {recent.map((post) => (
            <article key={post.id} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex gap-6">
                {post.featuredImage && (
                  <div className="w-48 h-32 flex-shrink-0 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}${post.featuredImage.url}`}
                      alt={post.featuredImage.alternativeText || post.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex gap-2 mb-1">
                    {post.categories?.map((cat) => (
                      <span key={cat.slug} className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                        {cat.name}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    <Link href={`/posts/${post.slug}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </h3>
                  {post.excerpt && (
                    <p className="text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {post.author && <span>{post.author.username}</span>}
                    <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                    <span>{post.readingTimeMinutes} min read</span>
                    <span>{post.viewCount} views</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Newsletter CTA ────────────────────────────────── */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-primary-100 mb-6">
            Get the latest posts, product updates, and community highlights delivered to your inbox.
          </p>
          <form action="/newsletter" method="GET" className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              required
              className="input flex-1 bg-white/10 border-white/20 text-white placeholder:text-primary-200"
            />
            <button type="submit" className="btn bg-white text-primary-700 hover:bg-primary-50 px-6">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
