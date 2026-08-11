/**
 * 阅读进度 — 客户端存储适配层
 *
 * 静态部署模式下使用 localStorage，有后端时使用 API。
 * 与 ReadingProgressTracker 组件配合使用。
 */

import { localReadingProgress } from "./storage/local-stores";
import type { LocalReadingRecord, LocalReadingStats } from "./storage/local-stores";

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
 * 优先尝试 API，失败时回退到 localStorage。
 */
export async function recordReading(params: {
  book: string;
  chapter: number;
}): Promise<ReadingRecord> {
  try {
    const resp = await fetch("/api/reading-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (resp.ok) {
      const data = await resp.json();
      return data.record;
    }
  } catch {
    // API 不可用，使用 localStorage
  }

  return localReadingProgress.record(params.book, params.chapter);
}

/**
 * 获取阅读历史。
 */
export async function getReadingHistory(
  limit: number = 50
): Promise<ReadingRecord[]> {
  try {
    const resp = await fetch(
      `/api/reading-progress?limit=${limit}`
    );
    if (resp.ok) {
      const data = await resp.json();
      return data.history ?? [];
    }
  } catch {
    // 回退到 localStorage
  }

  return localReadingProgress.getHistory(limit);
}

/**
 * 获取阅读统计。
 */
export async function getReadingStats(): Promise<ReadingStats> {
  try {
    const resp = await fetch("/api/reading-progress?stats=true");
    if (resp.ok) {
      const data = await resp.json();
      return data.stats;
    }
  } catch {
    // 回退到 localStorage
  }

  return localReadingProgress.getStats();
}
