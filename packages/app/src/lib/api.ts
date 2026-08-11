/**
 * API 适配层 — API Adapter
 *
 * 统一的数据访问层。优先调用后端 API，不可用时自动回退到 localStorage。
 * 为 GitHub Pages 静态部署设计：API 调用失败 → 静默回退到本地存储。
 *
 * 设计原则：
 * - 每个函数签名与后端 API 响应格式兼容
 * - 快速失败：fetch 2s 超时，不阻塞 UI
 * - 零外部依赖，纯 fetch + localStorage
 */

import {
  localBookmarks,
  localNotes,
  localReadingProgress,
  detectStaticMode,
} from "./storage/local-stores";
import type {
  LocalBookmark,
  LocalNote,
  LocalReadingRecord,
  LocalReadingStats,
} from "./storage/local-stores";

// ── 配置 ──────────────────────────────────────────────────────────────────────

const API_TIMEOUT_MS = 2500;

/** 带超时的 fetch。 */
async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeoutMs: number = API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 尝试调用 API。失败（网络错误、超时、非 2xx）时返回 null。
 * 不抛出异常——调用方检查 null 后回退到 localStorage。
 */
async function tryApi<T>(
  url: string,
  options?: RequestInit
): Promise<T | null> {
  try {
    const res = await fetchWithTimeout(url, options);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ── 书签 API ──────────────────────────────────────────────────────────────────

export interface BookmarkItem {
  id: number | string;
  book: string;
  chapter: number;
  verse: number;
  note?: string | null;
  created_at?: string;
}

/**
 * 获取所有书签。API 不可用时回退到 localStorage。
 */
export async function getBookmarks(): Promise<BookmarkItem[]> {
  const data = await tryApi<{ bookmarks: BookmarkItem[] }>(
    "/api/bookmarks?limit=200"
  );
  if (data?.bookmarks) return data.bookmarks;

  // localStorage 回退
  const local = localBookmarks.getAll(200);
  return local.map((b: LocalBookmark) => ({
    id: b.id,
    book: b.book,
    chapter: b.chapter,
    verse: b.verse,
    note: b.note,
    created_at: b.created_at,
  }));
}

/**
 * 添加书签。
 */
export async function addBookmark(params: {
  book: string;
  chapter: number;
  verse: number;
}): Promise<BookmarkItem> {
  const data = await tryApi<{ bookmark: BookmarkItem }>("/api/bookmarks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (data?.bookmark) return data.bookmark;

  // localStorage 回退
  const local = localBookmarks.add(params);
  return {
    id: local.id,
    book: local.book,
    chapter: local.chapter,
    verse: local.verse,
    note: local.note,
    created_at: local.created_at,
  };
}

/**
 * 删除书签。
 */
export async function removeBookmark(id: number | string): Promise<boolean> {
  const res = await tryApi<{ success: boolean }>(
    `/api/bookmarks?id=${encodeURIComponent(String(id))}`,
    { method: "DELETE" }
  );
  if (res?.success) return true;
  // 如果 API 返回 2xx 但无 success 字段，也认为成功
  if (res !== null && res !== undefined) return true;

  // localStorage 回退
  return localBookmarks.remove(String(id));
}

// ── 笔记 API ──────────────────────────────────────────────────────────────────

export interface NoteItem {
  id: number | string;
  book: string;
  chapter: number;
  verse: number;
  content: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 获取某节经文的笔记列表。
 */
export async function getNotesForVerse(
  book: string,
  chapter: number,
  verse: number
): Promise<NoteItem[]> {
  const data = await tryApi<{ notes: NoteItem[] }>(
    `/api/notes?book=${encodeURIComponent(book)}&chapter=${chapter}&verse=${verse}`
  );
  if (data?.notes) return data.notes;

  // localStorage 回退
  const local = localNotes.getForVerse(book, chapter, verse);
  return local.map((n: LocalNote) => ({
    id: n.id,
    book: n.book,
    chapter: n.chapter,
    verse: n.verse,
    content: n.content,
    created_at: n.created_at,
    updated_at: n.updated_at,
  }));
}

/**
 * 创建笔记。
 */
export async function createNote(params: {
  book: string;
  chapter: number;
  verse: number;
  content: string;
}): Promise<NoteItem> {
  const data = await tryApi<{ note: NoteItem }>("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (data?.note) return data.note;

  // localStorage 回退
  const local = localNotes.create(params);
  return {
    id: local.id,
    book: local.book,
    chapter: local.chapter,
    verse: local.verse,
    content: local.content,
    created_at: local.created_at,
    updated_at: local.updated_at,
  };
}

// ── 阅读进度 API ──────────────────────────────────────────────────────────────

export interface ReadingRecord {
  book: string;
  chapter: number;
  read_at: string;
}

export interface ReadingStats {
  total_chapters_read: number;
  total_books_started: number;
  last_read_book: string | null;
  last_read_chapter: number | null;
  last_read_at: string | null;
}

/**
 * 记录一章已读。
 */
export async function recordReading(params: {
  book: string;
  chapter: number;
}): Promise<ReadingRecord> {
  const data = await tryApi<{ record: ReadingRecord }>(
    "/api/reading-progress",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    }
  );
  if (data?.record) return data.record;

  // localStorage 回退
  const local = localReadingProgress.record(params.book, params.chapter);
  return local;
}

/**
 * 获取阅读历史。
 */
export async function getReadingHistory(
  limit: number = 50
): Promise<ReadingRecord[]> {
  const data = await tryApi<{ history: ReadingRecord[] }>(
    `/api/reading-progress?limit=${limit}`
  );
  if (data?.history) return data.history;

  // localStorage 回退
  return localReadingProgress.getHistory(limit);
}

/**
 * 获取阅读统计。
 */
export async function getReadingStats(): Promise<ReadingStats> {
  const data = await tryApi<{ stats: ReadingStats }>(
    "/api/reading-progress?stats=true"
  );
  if (data?.stats) return data.stats;

  // localStorage 回退
  return localReadingProgress.getStats();
}

// ── 模式检测 ──────────────────────────────────────────────────────────────────

export { detectStaticMode as isStaticMode } from "./storage/local-stores";

/**
 * 检查 localStorage 是否可用。
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const testKey = "__xjoy_api_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
