/**
 * 搜索页 — Search
 *
 * Full-text search over the KJV Bible.
 */
"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { VerseSearchResult } from "@xjoy/db";

const POPULAR_SEARCHES = [
  "信心",
  "爱",
  "恩典",
  "宽恕",
  "祷告",
  "智慧",
  "怜悯",
  "公义",
  "平安",
  "救恩",
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VerseSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (q?: string) => {
    const term = (q ?? query).trim();
    if (!term) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(
        `/api/verses?q=${encodeURIComponent(term)}&limit=20`
      );
      if (!res.ok) throw new Error("搜索失败");
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch]
  );

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          搜索经文
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-500">
          按关键词在 KJV 圣经中搜索
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="搜索经文关键词…"
          className="w-full px-4 py-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 text-base placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
          aria-label="搜索经文"
          autoFocus
        />
        <button
          onClick={() => handleSearch()}
          disabled={loading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40 transition-colors"
          aria-label="搜索"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-4 h-4"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Results */}
      {!loading && searched && (
        <div>
          {results.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-4">
                找到 {results.length} 条相关经文
              </p>
              {results.map((v) => (
                <Link
                  key={v.id}
                  href={`/reader/${encodeURIComponent(v.book)}/${v.chapter}`}
                  className="block p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 transition-colors"
                >
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-500 mb-1">
                    {v.book} {v.chapter}:{v.verse}
                  </p>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {v.text}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-500 dark:text-neutral-500">
                未找到匹配的经文，请尝试其他关键词
              </p>
            </div>
          )}
        </div>
      )}

      {/* Popular searches */}
      {!searched && (
        <div className="mt-8">
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-500 mb-3">
            热门搜索
          </p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                onClick={() => {
                  setQuery(term);
                  handleSearch(term);
                }}
                className="px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-600 dark:text-neutral-400 hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
