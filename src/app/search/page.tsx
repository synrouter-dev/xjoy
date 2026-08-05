import { ScreenHeader } from "@/components/ScreenHeader";
import { PlaceholderCard } from "@/components/PlaceholderCard";

export default function SearchPage() {
  return (
    <div>
      <ScreenHeader
        title="Search"
        description="Search the King James Bible by keyword, phrase, or topic."
      />

      {/* Search bar preview */}
      <div className="relative mb-8">
        <input
          type="search"
          placeholder="Search scripture..."
          disabled
          className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 text-base placeholder:text-neutral-400 dark:placeholder:text-neutral-600 disabled:opacity-60"
          aria-label="Search scripture"
        />
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </div>

      <PlaceholderCard
        title="Coming Soon"
        body="Full-text and semantic search over the KJV is on the way. You will be able to search by keyword, phrase, or topic, with results ranked by relevance and linked directly to the scripture text."
      />

      {/* Popular search terms preview */}
      <div className="mt-8">
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-500 mb-3">
          Popular searches
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            "faith",
            "love",
            "grace",
            "forgiveness",
            "prayer",
            "wisdom",
            "mercy",
            "righteousness",
            "peace",
            "salvation",
          ].map((term) => (
            <span
              key={term}
              className="px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-500 dark:text-neutral-500"
            >
              {term}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
