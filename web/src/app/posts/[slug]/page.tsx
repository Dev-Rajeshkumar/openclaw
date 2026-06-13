import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api, Post } from '@/lib/api';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    const res = await api.getPost(slug);
    return res.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: post.author ? [post.author.username] : undefined,
      images: post.featuredImage ? [{ url: post.featuredImage.url }] : undefined,
    },
  };
}

export async function generateStaticParams() {
  try {
    const res = await api.getPosts({ pageSize: 100 });
    return (res.data || []).map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

export const revalidate = 60;

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/posts" className="hover:underline">Blog</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-gray-100">{post.title}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex gap-2 mb-3">
          {post.categories?.map((cat) => (
            <Link
              key={cat.slug}
              href={`/posts?category=${cat.slug}`}
              className="text-sm bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800"
            >
              {cat.name}
            </Link>
          ))}
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
            {post.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
          {post.author && (
            <div className="flex items-center gap-2">
              {post.author.avatar && (
                <img
                  src={post.author.avatar}
                  alt={post.author.username}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {post.author.username}
              </span>
            </div>
          )}
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </time>
          <span>{post.readingTimeMinutes} min read</span>
          <span>{post.viewCount.toLocaleString()} views</span>
        </div>
      </header>

      {/* Featured Image */}
      {post.featuredImage && (
        <figure className="mb-10">
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL}${post.featuredImage.url}`}
            alt={post.featuredImage.alternativeText || post.title}
            className="w-full rounded-lg shadow-lg"
          />
          {post.featuredImage.alternativeText && (
            <figcaption className="text-sm text-gray-500 mt-2 text-center">
              {post.featuredImage.alternativeText}
            </figcaption>
          )}
        </figure>
      )}

      {/* Content */}
      <div
        className="prose-content mb-12"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-8">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/posts?tag=${tag.slug}`}
                className="text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Author Box */}
      {post.author && (
        <div className="card p-6 mb-8">
          <div className="flex items-start gap-4">
            {post.author.avatar && (
              <img
                src={post.author.avatar}
                alt={post.author.username}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <h3 className="font-semibold text-lg">{post.author.username}</h3>
              {post.author.bio && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">{post.author.bio}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comments Section */}
      <section id="comments" className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Comments</h2>
        <CommentsSection postId={post.id} />
      </section>
    </article>
  );
}

// ── Comments Component (Client) ──────────────────────────────

'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

function CommentsSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createComment({
        content,
        postId,
        authorName: authorName || undefined,
        authorEmail: authorEmail || undefined,
      });
      setMessage('Comment submitted for moderation.');
      setContent('');
      setAuthorName('');
      setAuthorEmail('');
    } catch {
      setMessage('Failed to submit comment. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div>
      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="card p-6 mb-8">
        <h3 className="font-semibold mb-4">Leave a Comment</h3>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Name (optional)"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="input"
          />
          <input
            type="email"
            placeholder="Email (optional, not shown)"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            className="input"
          />
        </div>
        <textarea
          placeholder="Write your comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
          className="input mb-4"
        />
        <button type="submit" disabled={submitting || !content.trim()} className="btn-primary">
          {submitting ? 'Submitting...' : 'Submit Comment'}
        </button>
        {message && <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{message}</p>}
      </form>

      {/* Comments List */}
      {comments.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No comments yet. Be the first to share your thoughts!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">{comment.authorName || 'Anonymous'}</span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
