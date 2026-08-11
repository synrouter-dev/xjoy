/**
 * 书卷目录页 — Book Catalog
 *
 * Mobile-first grid view of all 66 Bible books organized by testament (OT/NT)
 * and section. Fetches book metadata from API (server-only data).
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getBooks } from "@/lib/bible-data";

// ── Types ────────────────────────────────────────────────────────────────────

interface BookMeta {
  name: string;
  chapters: number;
  testament: "old" | "new";
  section: string;
}

type Testament = "old" | "new";

const TESTAMENT_LABELS: Record<Testament, string> = {
  old: "旧约",
  new: "新约",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CatalogPage() {
  const [books, setBooks] = useState<BookMeta[]>([]);
  const [testament, setTestament] = useState<Testament>("old");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 优先使用客户端数据（零网络请求），API 作为回退
    const localBooks = getBooks();
    if (localBooks.length > 0) {
      setBooks(localBooks);
      setLoading(false);
      return;
    }

    fetch("/api/books")
      .then((res) => res.json())
      .then((data) => setBooks(data.books ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = books.filter((b) => b.testament === testament);

  // Group by section
  const sections = new Map<string, BookMeta[]>();
  for (const b of filtered) {
    const list = sections.get(b.section) || [];
    list.push(b);
    sections.set(b.section, list);
  }

  const oldCount = books.filter((b) => b.testament === "old").length;
  const newCount = books.filter((b) => b.testament === "new").length;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          圣经目录
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-500">
          共 {books.length} 卷书 · {oldCount} 卷旧约 · {newCount} 卷新约
        </p>
      </div>

      {/* ── Testament Tabs ── */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800">
        {(["old", "new"] as Testament[]).map((t) => (
          <button
            key={t}
            onClick={() => setTestament(t)}
            className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
              testament === t
                ? "bg-white dark:bg-neutral-700 text-amber-600 dark:text-amber-500 shadow-sm"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            {TESTAMENT_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── Book Grid by Section ── */}
      <div className="space-y-8">
        {[...sections.entries()].map(([section, sectionBooks]) => (
          <div key={section}>
            <h2 className="text-sm font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide mb-3 px-1">
              {section}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {sectionBooks.map((book) => (
                <Link
                  key={book.name}
                  href={`/reader/${encodeURIComponent(book.name)}/1`}
                  className="flex flex-col items-center justify-center p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 transition-colors text-center min-h-[72px]"
                >
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-tight">
                    {book.name}
                  </span>
                  <span className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                    {book.chapters} 章
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
