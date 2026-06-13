import { Metadata } from 'next';
import Link from 'next/link';
import PostEditor from './PostEditor';

export const metadata: Metadata = {
  title: 'New Post — Dashboard',
};

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/posts"
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back to posts"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create New Post</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            Write, preview, and publish your content
          </p>
        </div>
      </div>

      {/* Editor */}
      <PostEditor />
    </div>
  );
}
