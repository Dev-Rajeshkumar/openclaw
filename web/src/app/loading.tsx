export default function LoadingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-48 mb-6" />

      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex gap-2 mb-3">
          <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-full w-20" />
          <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-full w-24" />
        </div>
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-full max-w-2xl mb-4" />
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-full max-w-xl mb-6" />
        <div className="flex gap-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-28" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-16" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-20" />
        </div>
      </div>

      {/* Featured image skeleton */}
      <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg mb-10" />

      {/* Content skeleton */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/5" />
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-2/3 mt-6" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
      </div>

      {/* Tags skeleton */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-8 mb-8">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-12 mb-3" />
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-16" />
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-20" />
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-14" />
        </div>
      </div>

      {/* Author skeleton */}
      <div className="card p-6 mb-8 flex items-start gap-4">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex-shrink-0" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-32 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full max-w-xs" />
        </div>
      </div>

      {/* Comments skeleton */}
      <div className="mt-12">
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-32 mb-6" />
        <div className="card p-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
        </div>
      </div>
    </div>
  );
}
