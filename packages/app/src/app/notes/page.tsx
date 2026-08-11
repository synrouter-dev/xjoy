/**
 * 笔记与书签页 — Notes & Bookmarks
 *
 * Tab-switched view: Notes (list/create/edit/delete) + Bookmarks (list/delete).
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { localNotes, localBookmarks, localReadingProgress } from "@/lib/storage/local-stores";
import type { LocalNote, LocalBookmark, LocalReadingStats } from "@/lib/storage/local-stores";

// 本地类型别名（兼容原有 API 类型）
type Note = LocalNote;
type Bookmark = LocalBookmark;
type ReadingStats = LocalReadingStats;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Bookmark List ────────────────────────────────────────────────────────────

function BookmarksTab() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bookmarks?limit=100");
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data.bookmarks ?? []);
        return;
      }
    } catch {
      // API 不可用，回退到 localStorage
    }
    // localStorage 回退
    setBookmarks(localBookmarks.getAll(100));
    setLoading(false);
  }, []);

  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  const handleDelete = async (bm: Bookmark) => {
    if (!confirm(`确定删除「${bm.book} ${bm.chapter}:${bm.verse}」的书签？`)) return;
    try {
      await fetch(`/api/bookmarks?id=${bm.id}`, { method: "DELETE" });
    } catch {
      // API 不可用，使用 localStorage
    }
    localBookmarks.remove(bm.id);
    fetchBookmarks();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4 opacity-30">🔖</div>
        <p className="text-neutral-500 dark:text-neutral-500 mb-2">还没有书签</p>
        <p className="text-sm text-neutral-400 dark:text-neutral-500">
          在读经时长按经文即可添加书签
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {bookmarks.map((bm) => (
        <div
          key={bm.id}
          className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-amber-200 dark:hover:border-amber-800 transition-colors"
        >
          <Link
            href={`/reader/${encodeURIComponent(bm.book)}/${bm.chapter}`}
            className="flex-1 min-w-0"
          >
            <p className="text-sm font-medium text-amber-600 dark:text-amber-500 truncate">
              {bm.book} {bm.chapter}:{bm.verse}
            </p>
            {bm.note && (
              <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5 truncate">
                {bm.note}
              </p>
            )}
            <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-0.5">
              {formatDate(bm.created_at)}
            </p>
          </Link>
          <button
            onClick={() => handleDelete(bm)}
            className="text-red-400 hover:text-red-500 transition-colors p-1"
            aria-label="删除书签"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Notes Tab ────────────────────────────────────────────────────────────────

function NoteCard({
  note,
  onEdit,
  onDelete,
}: {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
      <Link
        href={`/reader/${encodeURIComponent(note.book)}/${note.chapter}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 mb-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        {note.book} {note.chapter}:{note.verse}
      </Link>

      <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
        {expanded ? (
          <p className="whitespace-pre-wrap">{note.content}</p>
        ) : (
          <p className="line-clamp-3">{note.content}</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
        <span className="text-xs text-neutral-400 dark:text-neutral-500">
          {formatDate(note.updated_at)}
        </span>
        <div className="flex items-center gap-2">
          {note.content.length > 120 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            >
              {expanded ? "收起" : "展开"}
            </button>
          )}
          <button
            onClick={onEdit}
            className="text-xs text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
          >
            编辑
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-red-500 hover:text-red-600 transition-colors"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}

function NotesTab() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/notes?limit=100");
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes);
        return;
      }
    } catch {
      // API 不可用，回退到 localStorage
    }
    // localStorage 回退
    setNotes(localNotes.getAll(100));
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleSave = useCallback(
    async (content: string) => {
      if (!content.trim() || !editingNote) return;
      try {
        const res = await fetch("/api/notes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingNote.id, content }),
        });
        if (res.ok) {
          setEditingNote(null);
          fetchNotes();
          return;
        }
      } catch {
        // API 不可用
      }
      // localStorage 回退
      localNotes.update(editingNote.id, content);
      setEditingNote(null);
      fetchNotes();
    },
    [editingNote, fetchNotes]
  );

  const handleDelete = useCallback(
    async (note: Note) => {
      if (!confirm(`确定删除「${note.book} ${note.chapter}:${note.verse}」的笔记？`)) return;
      try {
        const res = await fetch(`/api/notes?id=${note.id}`, { method: "DELETE" });
        if (res.ok) {
          fetchNotes();
          return;
        }
      } catch {
        // API 不可用
      }
      localNotes.remove(note.id);
      fetchNotes();
    },
    [fetchNotes]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-3">{error}</p>
        <button onClick={fetchNotes} className="text-sm text-amber-600 hover:text-amber-700">重试</button>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4 opacity-30">📝</div>
        <p className="text-neutral-500 dark:text-neutral-500 mb-2">还没有笔记</p>
        <p className="text-sm text-neutral-400 dark:text-neutral-500">
          在读经时点击经文号即可添加笔记
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onEdit={() => setEditingNote(note)}
            onDelete={() => handleDelete(note)}
          />
        ))}
      </div>

      {/* Edit Modal */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">编辑笔记</h3>
              <button onClick={() => setEditingNote(null)} className="text-neutral-400 hover:text-neutral-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              <p className="text-sm text-amber-600 dark:text-amber-500 mb-3">
                {editingNote.book} {editingNote.chapter}:{editingNote.verse}
              </p>
              <textarea
                defaultValue={editingNote.content}
                onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                className="w-full min-h-[200px] text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-3 px-5 py-4 border-t border-neutral-200 dark:border-neutral-800">
              <button onClick={() => setEditingNote(null)} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                取消
              </button>
              <button onClick={() => handleSave(editingNote.content)} disabled={!editingNote.content.trim()}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Reading Progress Tab ─────────────────────────────────────────────────────

function ProgressTab() {
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/reading-progress?stats=true");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        return;
      }
    } catch {
      // API 不可用，回退到 localStorage
    }
    // localStorage 回退
    setStats(localReadingProgress.getStats());
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-3">{error}</p>
        <button onClick={fetchStats} className="text-sm text-amber-600 hover:text-amber-700">重试</button>
      </div>
    );
  }

  if (!stats || stats.total_chapters_read === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4 opacity-30">📖</div>
        <p className="text-neutral-500 dark:text-neutral-500 mb-2">还没有阅读记录</p>
        <p className="text-sm text-neutral-400 dark:text-neutral-500">
          开始读经，进度会自动记录
        </p>
      </div>
    );
  }

  const progressPercent = Math.round((stats.total_chapters_read / 1189) * 100);

  return (
    <div className="space-y-6">
      {/* Progress overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.total_chapters_read}</p>
          <p className="text-xs text-amber-600/70 dark:text-amber-500/70 mt-1">已读章节</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.total_books_started}</p>
          <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70 mt-1">已开始书卷</p>
        </div>
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{progressPercent}%</p>
          <p className="text-xs text-blue-600/70 dark:text-blue-500/70 mt-1">整本圣经</p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">阅读进度</span>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            {stats.total_chapters_read} / 1,189 章
          </span>
        </div>
        <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Last read */}
      {stats.last_read_book && stats.last_read_chapter && (
        <div>
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
            最近阅读
          </h3>
          <Link
            href={`/reader/${encodeURIComponent(stats.last_read_book)}/${stats.last_read_chapter}`}
            className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-amber-200 dark:hover:border-amber-800 transition-colors"
          >
            <span className="text-sm font-medium text-amber-600 dark:text-amber-500">
              {stats.last_read_book} {stats.last_read_chapter}
            </span>
            {stats.last_read_at && (
              <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-auto">
                {formatDate(stats.last_read_at)}
              </span>
            )}
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type Tab = "notes" | "bookmarks" | "progress";

export default function NotesPage() {
  const [tab, setTab] = useState<Tab>("notes");

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            笔记与书签
          </h1>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            管理你的灵修笔记、经文书签和阅读进度
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800">
        <button
          onClick={() => setTab("notes")}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
            tab === "notes"
              ? "bg-white dark:bg-neutral-700 text-amber-600 dark:text-amber-500 shadow-sm"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
          }`}
        >
          📝 笔记
        </button>
        <button
          onClick={() => setTab("bookmarks")}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
            tab === "bookmarks"
              ? "bg-white dark:bg-neutral-700 text-amber-600 dark:text-amber-500 shadow-sm"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
          }`}
        >
          🔖 书签
        </button>
        <button
          onClick={() => setTab("progress")}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
            tab === "progress"
              ? "bg-white dark:bg-neutral-700 text-amber-600 dark:text-amber-500 shadow-sm"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
          }`}
        >
          📖 进度
        </button>
      </div>

      {/* Content */}
      {tab === "notes" && <NotesTab />}
      {tab === "bookmarks" && <BookmarksTab />}
      {tab === "progress" && <ProgressTab />}
    </div>
  );
}
