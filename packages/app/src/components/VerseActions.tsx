/**
 * VerseActions — Verse-level bookmark toggle and note sheet.
 *
 * Each verse in verse-by-verse mode shows a small action button that opens
 * a popover with: bookmark toggle, add note, copy verse, share.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Bookmark } from "@/lib/bookmarks";
import type { Note } from "@/lib/notes";

interface VerseActionsProps {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export function VerseActions({ book, chapter, verse, text }: VerseActionsProps) {
  const [open, setOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<number | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [existingNotes, setExistingNotes] = useState<Note[]>([]);

  // Check bookmark status + existing notes when popover opens
  useEffect(() => {
    if (!open) {
      setExistingNotes([]);
      return;
    }

    // Fetch bookmark status
    fetch(`/api/bookmarks?limit=200`)
      .then((res) => res.json())
      .then((data) => {
        const match = data.bookmarks?.find(
          (b: Bookmark) => b.book === book && b.chapter === chapter && b.verse === verse
        );
        if (match) {
          setBookmarked(true);
          setBookmarkId(match.id);
        } else {
          setBookmarked(false);
          setBookmarkId(null);
        }
      })
      .catch(() => {});

    // Fetch existing notes for this verse
    fetch(`/api/notes?book=${encodeURIComponent(book)}&chapter=${chapter}&verse=${verse}`)
      .then((res) => res.json())
      .then((data) => setExistingNotes(data.notes ?? []))
      .catch(() => {});
  }, [open, book, chapter, verse]);

  const toggleBookmark = useCallback(async () => {
    if (bookmarked && bookmarkId) {
      const res = await fetch(`/api/bookmarks?id=${bookmarkId}`, { method: "DELETE" });
      if (res.ok) {
        setBookmarked(false);
        setBookmarkId(null);
      }
    } else {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book, chapter, verse }),
      });
      if (res.ok) {
        const data = await res.json();
        setBookmarked(true);
        setBookmarkId(data.bookmark.id);
      }
    }
  }, [bookmarked, bookmarkId, book, chapter, verse]);

  const saveNote = useCallback(async () => {
    if (!noteContent.trim()) return;
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ book, chapter, verse, content: noteContent.trim() }),
    });
    if (res.ok) {
      // 刷新笔记列表，让用户立即看到刚保存的笔记
      fetch(`/api/notes?book=${encodeURIComponent(book)}&chapter=${chapter}&verse=${verse}`)
        .then((r) => r.json())
        .then((data) => setExistingNotes(data.notes ?? []))
        .catch(() => {});
      setNoteContent("");
      setNoteOpen(false);
      // 重新打开弹窗，让用户看到新笔记
      setOpen(true);
    }
  }, [noteContent, book, chapter, verse]);

  const copyVerse = useCallback(async () => {
    const ref = `${book} ${chapter}:${verse}`;
    const copyText = `${ref} — ${text}`;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = copyText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [book, chapter, verse, text]);

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] text-neutral-400 dark:text-neutral-600 hover:text-amber-600 dark:hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
        aria-label={`${book} ${chapter}:${verse} 操作`}
      >
        {verse}
      </button>

      {/* Popover */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 left-0 mt-1 w-48 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-lg py-1.5 overflow-hidden">
            {/* Reference */}
            <div className="px-3 py-1.5 text-xs text-neutral-400 dark:text-neutral-500 border-b border-neutral-100 dark:border-neutral-800">
              {book} {chapter}:{verse}
            </div>

            {/* Existing Notes (if any) */}
            {existingNotes.length > 0 && (
              <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800 max-h-32 overflow-y-auto">
                {existingNotes.map((n) => (
                  <p key={n.id} className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-1 last:mb-0 line-clamp-2">
                    📝 {n.content}
                  </p>
                ))}
              </div>
            )}

            {/* Bookmark */}
            <button
              onClick={toggleBookmark}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={bookmarked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={1.5}
                className={`w-4 h-4 ${bookmarked ? "text-amber-600 dark:text-amber-500" : ""}`}
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              {bookmarked ? "已收藏" : "添加书签"}
            </button>

            {/* Add Note */}
            <button
              onClick={() => {
                setNoteOpen(true);
                setOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="w-4 h-4"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              添加笔记
            </button>

            {/* Copy */}
            <button
              onClick={copyVerse}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="w-4 h-4"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {copied ? "已复制 ✓" : "复制经文"}
            </button>
          </div>
        </>
      )}

      {/* Note Editor Modal */}
      {noteOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                添加笔记 — {book} {chapter}:{verse}
              </h3>
              <button
                onClick={() => setNoteOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-neutral-400 dark:text-neutral-500 italic mb-3 line-clamp-2">
                &ldquo;{text}&rdquo;
              </p>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="写下你对这节经文的感悟…"
                className="w-full min-h-[120px] text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-3 px-5 py-4 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setNoteOpen(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveNote}
                disabled={!noteContent.trim()}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 dark:hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                保存笔记
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
