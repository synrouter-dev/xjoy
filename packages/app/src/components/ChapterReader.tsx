"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Verse, BookMeta } from "@xjoy/shared";
import { VerseActions } from "./VerseActions";

// ── Types ────────────────────────────────────────────────────────────────────

type DisplayMode = "paragraph" | "verse-by-verse" | "reader";
type FontSize = "sm" | "md" | "lg" | "xl" | "xxl";

interface ReadingPosition {
  book: string;
  chapter: number;
}

interface ChapterReaderProps {
  book: string;
  chapter: number;
  verses: Verse[];
  books: BookMeta[];
  adjacent: {
    prev: { book: string; chapter: number } | null;
    next: { book: string; chapter: number } | null;
  };
}

// ── Constants ────────────────────────────────────────────────────────────────

const FONT_SIZE_CLASSES: Record<FontSize, string> = {
  sm: "text-sm leading-relaxed",
  md: "text-base leading-relaxed",
  lg: "text-lg leading-relaxed",
  xl: "text-xl leading-relaxed",
  xxl: "text-2xl leading-relaxed",
};

const FONT_SIZE_LABELS: Record<FontSize, string> = {
  sm: "Small",
  md: "Medium",
  lg: "Large",
  xl: "X-Large",
  xxl: "XX-Large",
};

const DISPLAY_MODE_LABELS: Record<DisplayMode, string> = {
  paragraph: "Paragraph",
  "verse-by-verse": "Verse by Verse",
  reader: "Reader",
};

const STORAGE_KEYS = {
  position: "xjoy-reading-position",
  fontSize: "xjoy-font-size",
  displayMode: "xjoy-display-mode",
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStoredPosition(): ReadingPosition | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.position);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.book && typeof parsed.chapter === "number") return parsed;
  } catch {
    // corrupted
  }
  return null;
}

function savePosition(pos: ReadingPosition) {
  try {
    localStorage.setItem(STORAGE_KEYS.position, JSON.stringify(pos));
  } catch {
    // storage unavailable
  }
}

function getStoredFontSize(): FontSize {
  if (typeof window === "undefined") return "md";
  try {
    const v = localStorage.getItem(STORAGE_KEYS.fontSize);
    if (v && v in FONT_SIZE_CLASSES) return v as FontSize;
  } catch {
    // ignore
  }
  return "md";
}

function getStoredDisplayMode(): DisplayMode {
  if (typeof window === "undefined") return "paragraph";
  try {
    const v = localStorage.getItem(STORAGE_KEYS.displayMode);
    if (v === "paragraph" || v === "verse-by-verse" || v === "reader")
      return v;
  } catch {
    // ignore
  }
  return "paragraph";
}

function bookUrl(book: string, chapter: number): string {
  return `/reader/${encodeURIComponent(book)}/${chapter}`;
}

// ── Icons ────────────────────────────────────────────────────────────────────

function ChevronLeft() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="w-4 h-4"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="w-4 h-4"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// ── Components ───────────────────────────────────────────────────────────────

/** Section-header for grouping books in the dropdown */
function BookOptionGroup({
  label,
  testament,
  books,
  currentBook,
}: {
  label: string;
  testament: "old" | "new";
  books: BookMeta[];
  currentBook: string;
}) {
  return (
    <optgroup
      label={`${testament === "old" ? "OT" : "NT"} — ${label}`}
      className="text-neutral-500 dark:text-neutral-400"
    >
      {books.map((b) => (
        <option
          key={b.name}
          value={`${b.name}|${b.chapters}`}
          className="text-neutral-900 dark:text-neutral-100"
        >
          {b.name}
        </option>
      ))}
    </optgroup>
  );
}

/** Book selection dropdown */
function BookSelector({
  books,
  currentBook,
  currentChapter,
}: {
  books: BookMeta[];
  currentBook: string;
  currentChapter: number;
}) {
  const router = useRouter();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const [book] = e.target.value.split("|");
      if (!book || book === currentBook) return;
      router.push(bookUrl(book, 1));
    },
    [router, currentBook]
  );

  // Group books by section within testament, preserving order
  const sections = new Map<string, BookMeta[]>();
  let currentSection = "";
  for (const b of books) {
    if (b.section !== currentSection) {
      currentSection = b.section;
      sections.set(b.section, []);
    }
    sections.get(b.section)!.push(b);
  }

  return (
    <div className="relative">
      <select
        value={`${currentBook}|${currentChapter}`}
        onChange={handleChange}
        className="appearance-none w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-accent/50 cursor-pointer"
        aria-label="Select a book"
      >
        {[...sections.entries()].map(([section, sectionBooks]) => {
          const testament = sectionBooks[0]?.testament ?? "old";
          return (
            <BookOptionGroup
              key={section}
              label={section}
              testament={testament}
              books={sectionBooks}
              currentBook={currentBook}
            />
          );
        })}
      </select>
      <svg
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}

/** Chapter selector dropdown */
function ChapterSelector({
  chapters,
  currentChapter,
  currentBook,
}: {
  chapters: number;
  currentChapter: number;
  currentBook: string;
}) {
  const router = useRouter();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const ch = parseInt(e.target.value, 10);
      if (ch === currentChapter) return;
      router.push(bookUrl(currentBook, ch));
    },
    [router, currentBook, currentChapter]
  );

  return (
    <div className="relative">
      <select
        value={currentChapter}
        onChange={handleChange}
        className="appearance-none bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-accent/50 cursor-pointer"
        aria-label="Select a chapter"
      >
        {Array.from({ length: chapters }, (_, i) => i + 1).map((ch) => (
          <option key={ch} value={ch}>
            Chapter {ch}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}

/** Font size control */
function FontSizeControl({
  fontSize,
  onChange,
}: {
  fontSize: FontSize;
  onChange: (s: FontSize) => void;
}) {
  const sizes: FontSize[] = ["sm", "md", "lg", "xl", "xxl"];

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Font size">
      {sizes.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            fontSize === s
              ? "bg-accent text-white"
              : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
          aria-pressed={fontSize === s}
          title={FONT_SIZE_LABELS[s]}
        >
          A
        </button>
      ))}
    </div>
  );
}

/** Display mode toggle */
function DisplayModeControl({
  mode,
  onChange,
}: {
  mode: DisplayMode;
  onChange: (m: DisplayMode) => void;
}) {
  const modes: DisplayMode[] = ["paragraph", "verse-by-verse", "reader"];

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Display mode">
      {modes.map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            mode === m
              ? "bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent-light"
              : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
          aria-pressed={mode === m}
        >
          {DISPLAY_MODE_LABELS[m]}
        </button>
      ))}
    </div>
  );
}

/** Verse text display */
function VerseDisplay({
  verses,
  displayMode,
  fontSize,
}: {
  verses: Verse[];
  displayMode: DisplayMode;
  fontSize: FontSize;
}) {
  if (verses.length === 0) {
    return (
      <p className="text-neutral-500 dark:text-neutral-500 italic py-12 text-center">
        No verses found for this chapter.
      </p>
    );
  }

  if (displayMode === "reader") {
    return (
      <div className={`${FONT_SIZE_CLASSES[fontSize]} text-neutral-900 dark:text-neutral-100`}>
        <p>
          {verses.map((v) => v.text).join(" ")}
        </p>
      </div>
    );
  }

  if (displayMode === "paragraph") {
    // Flow verses as a paragraph with tiny superscript numbers between verses
    return (
      <div className={`${FONT_SIZE_CLASSES[fontSize]} text-neutral-900 dark:text-neutral-100`}>
        <p>
          {verses.map((v, i) => (
            <span key={`${v.verse}`}>
              {i === 0 && (
                <sup className="text-[0.6em] text-neutral-400 dark:text-neutral-600 mr-0.5 font-sans select-none">
                  {v.verse}
                </sup>
              )}
              {v.text}
              {i < verses.length - 1 && (
                <sup className="text-[0.6em] text-neutral-400 dark:text-neutral-600 ml-0.5 mr-0.5 font-sans select-none">
                  {verses[i + 1].verse}
                </sup>
              )}
            </span>
          ))}
        </p>
      </div>
    );
  }

  // Verse-by-verse: each verse on its own line with verse number + actions
  return (
    <div className={`${FONT_SIZE_CLASSES[fontSize]} space-y-2`}>
      {verses.map((v) => (
        <div key={v.verse} className="flex gap-2 group">
          <div className="relative mt-[0.35em]">
            <VerseActions
              book={v.book}
              chapter={v.chapter}
              verse={v.verse}
              text={v.text}
            />
          </div>
          <span className="text-neutral-900 dark:text-neutral-100">{v.text}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function ChapterReader({
  book,
  chapter,
  verses,
  books,
  adjacent,
}: ChapterReaderProps) {
  const router = useRouter();
  const [fontSize, setFontSize] = useState<FontSize>("md");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("paragraph");
  const [mounted, setMounted] = useState(false);

  // Load persisted preferences on mount
  useEffect(() => {
    setFontSize(getStoredFontSize());
    setDisplayMode(getStoredDisplayMode());
    setMounted(true);
  }, []);

  // Save reading position
  useEffect(() => {
    savePosition({ book, chapter });
  }, [book, chapter]);

  const handleFontSizeChange = useCallback((s: FontSize) => {
    setFontSize(s);
    try {
      localStorage.setItem(STORAGE_KEYS.fontSize, s);
    } catch {
      // ignore
    }
  }, []);

  const handleDisplayModeChange = useCallback((m: DisplayMode) => {
    setDisplayMode(m);
    try {
      localStorage.setItem(STORAGE_KEYS.displayMode, m);
    } catch {
      // ignore
    }
  }, []);

  const currentBookMeta = books.find((b) => b.name === book);

  if (!mounted) {
    // Render a static version (no size/mode UI) for SSR hydration match
    return (
      <div>
        <div className="flex items-center gap-2 mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {book}
          </h1>
          <span className="text-neutral-400 dark:text-neutral-600">·</span>
          <span className="text-lg text-neutral-500 dark:text-neutral-500">
            Chapter {chapter}
          </span>
        </div>
        <VerseDisplay verses={verses} displayMode="paragraph" fontSize="md" />
      </div>
    );
  }

  return (
    <div>
      {/* ── Navigation Bar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <BookSelector
          books={books}
          currentBook={book}
          currentChapter={chapter}
        />
        {currentBookMeta && (
          <ChapterSelector
            chapters={currentBookMeta.chapters}
            currentChapter={chapter}
            currentBook={book}
          />
        )}
      </div>

      {/* ── Chapter Header ── */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          {book}
        </h1>
        <p className="mt-1 text-base text-neutral-500 dark:text-neutral-500">
          Chapter {chapter}
          {currentBookMeta && ` of ${currentBookMeta.chapters}`}
        </p>
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-wrap items-center gap-4 mb-8 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800/50">
        <FontSizeControl fontSize={fontSize} onChange={handleFontSizeChange} />
        <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" />
        <DisplayModeControl
          mode={displayMode}
          onChange={handleDisplayModeChange}
        />
      </div>

      {/* ── Scripture Text ── */}
      <div className="mb-12">
        <VerseDisplay
          verses={verses}
          displayMode={displayMode}
          fontSize={fontSize}
        />
      </div>

      {/* ── Chapter Navigation (Prev / Next) ── */}
      <div className="flex items-center justify-between pt-6 border-t border-neutral-200 dark:border-neutral-800">
        {adjacent.prev ? (
          <button
            onClick={() =>
              router.push(bookUrl(adjacent.prev!.book, adjacent.prev!.chapter))
            }
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            <ChevronLeft />
            <span>
              {adjacent.prev.book} {adjacent.prev.chapter}
            </span>
          </button>
        ) : (
          <div />
        )}

        {adjacent.next ? (
          <button
            onClick={() =>
              router.push(bookUrl(adjacent.next!.book, adjacent.next!.chapter))
            }
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            <span>
              {adjacent.next.book} {adjacent.next.chapter}
            </span>
            <ChevronRight />
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
