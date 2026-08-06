/**
 * Loading skeleton shown during chapter navigation.
 * Uses subtle pulsing elements that match the ChapterReader's layout.
 */

function SkeletonBar({ width }: { width: string }) {
  return (
    <div
      className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"
      style={{ width }}
    />
  );
}

export default function ChapterLoading() {
  return (
    <div className="min-h-[80vh]" role="status" aria-label="Loading chapter">
      {/* Navigation skeleton */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="h-10 w-40 bg-neutral-100 dark:bg-neutral-900 rounded-lg animate-pulse" />
        <div className="h-10 w-32 bg-neutral-100 dark:bg-neutral-900 rounded-lg animate-pulse" />
      </div>

      {/* Chapter header skeleton */}
      <div className="mb-8 space-y-2">
        <SkeletonBar width="40%" />
        <SkeletonBar width="25%" />
      </div>

      {/* Controls skeleton */}
      <div className="flex flex-wrap items-center gap-4 mb-8 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800/50">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-6 w-7 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"
            />
          ))}
        </div>
        <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" />
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-6 w-20 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Text skeleton */}
      <div className="space-y-3 mb-12">
        <SkeletonBar width="100%" />
        <SkeletonBar width="95%" />
        <SkeletonBar width="88%" />
        <SkeletonBar width="92%" />
        <SkeletonBar width="76%" />
        <SkeletonBar width="100%" />
        <SkeletonBar width="84%" />
        <SkeletonBar width="91%" />
        <SkeletonBar width="63%" />
        <div className="h-4" />
        <SkeletonBar width="100%" />
        <SkeletonBar width="97%" />
        <SkeletonBar width="83%" />
        <SkeletonBar width="90%" />
        <SkeletonBar width="71%" />
        <SkeletonBar width="100%" />
        <SkeletonBar width="85%" />
        <SkeletonBar width="56%" />
      </div>

      {/* Footer nav skeleton */}
      <div className="flex items-center justify-between pt-6 border-t border-neutral-200 dark:border-neutral-800">
        <div className="h-10 w-32 bg-neutral-100 dark:bg-neutral-900 rounded-lg animate-pulse" />
        <div className="h-10 w-32 bg-neutral-100 dark:bg-neutral-900 rounded-lg animate-pulse" />
      </div>

      <span className="sr-only">Loading chapter…</span>
    </div>
  );
}
