"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ChapterError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Chapter page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="max-w-md space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Unable to Load Scripture
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            Something went wrong while loading this chapter. This may be a
            temporary issue — please try again.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
          <Link
            href="/reader/Genesis/1"
            className="inline-flex items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700 px-6 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            Go to Genesis 1
          </Link>
        </div>
      </div>
    </div>
  );
}
