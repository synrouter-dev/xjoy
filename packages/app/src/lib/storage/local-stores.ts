/**
 * localStorage 用户数据存储层
 *
 * 当后端 API 不可用时（GitHub Pages 静态部署），用 localStorage 替代 PostgreSQL。
 * 每个模块导出与 API 兼容的接口，方便组件层切换。
 *
 * 存储键名前缀 "xjoy:" 避免与其他应用冲突。
 */

// ── 类型 ──────────────────────────────────────────────────────────────────────

export interface LocalReadingRecord {
  book: string;
  chapter: number;
  read_at: string;
}

export interface LocalReadingStats {
  total_chapters_read: number;
  total_books_started: number;
  last_read_book: string | null;
  last_read_chapter: number | null;
  last_read_at: string | null;
}

export interface LocalNote {
  id: string; // crypto.randomUUID()
  book: string;
  chapter: number;
  verse: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface LocalBookmark {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  note: string | null;
  created_at: string;
}

// ── 工具函数 ──────────────────────────────────────────────────────────────────

function readStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(`xjoy:${key}`);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStore<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`xjoy:${key}`, JSON.stringify(value));
  } catch {
    // 存储满或其他错误 — 静默失败
  }
}

function nowISO(): string {
  return new Date().toISOString();
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // 回退：时间戳 + 随机数
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ── 阅读进度 ──────────────────────────────────────────────────────────────────

const READING_KEY = "reading-progress";

export const localReadingProgress = {
  /** 记录一章已读。 */
  record(book: string, chapter: number): LocalReadingRecord {
    const records = readStore<LocalReadingRecord[]>(READING_KEY, []);
    const now = nowISO();

    // 查找已有记录并更新，或新增
    const existing = records.find(
      (r) => r.book === book && r.chapter === chapter
    );
    if (existing) {
      existing.read_at = now;
    } else {
      records.push({ book, chapter, read_at: now });
    }

    writeStore(READING_KEY, records);
    return { book, chapter, read_at: now };
  },

  /** 获取阅读历史（最近 N 条）。 */
  getHistory(limit: number = 50): LocalReadingRecord[] {
    const records = readStore<LocalReadingRecord[]>(READING_KEY, []);
    return records
      .slice()
      .sort((a, b) => b.read_at.localeCompare(a.read_at))
      .slice(0, limit);
  },

  /** 获取阅读统计。 */
  getStats(): LocalReadingStats {
    const records = readStore<LocalReadingRecord[]>(READING_KEY, []);
    if (records.length === 0) {
      return {
        total_chapters_read: 0,
        total_books_started: 0,
        last_read_book: null,
        last_read_chapter: null,
        last_read_at: null,
      };
    }

    const sorted = records
      .slice()
      .sort((a, b) => b.read_at.localeCompare(a.read_at));
    const last = sorted[0];
    const uniqueBooks = new Set(records.map((r) => r.book));

    return {
      total_chapters_read: records.length,
      total_books_started: uniqueBooks.size,
      last_read_book: last.book,
      last_read_chapter: last.chapter,
      last_read_at: last.read_at,
    };
  },
};

// ── 笔记 ──────────────────────────────────────────────────────────────────────

const NOTES_KEY = "notes";

export const localNotes = {
  /** 创建一条笔记。 */
  create(params: {
    book: string;
    chapter: number;
    verse: number;
    content: string;
  }): LocalNote {
    const notes = readStore<LocalNote[]>(NOTES_KEY, []);
    const now = nowISO();
    const note: LocalNote = {
      id: generateId(),
      book: params.book,
      chapter: params.chapter,
      verse: params.verse,
      content: params.content,
      created_at: now,
      updated_at: now,
    };
    notes.push(note);
    writeStore(NOTES_KEY, notes);
    return note;
  },

  /** 获取所有笔记。 */
  getAll(limit: number = 50, offset: number = 0): LocalNote[] {
    const notes = readStore<LocalNote[]>(NOTES_KEY, []);
    return notes
      .slice()
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(offset, offset + limit);
  },

  /** 获取单条笔记。 */
  getById(id: string): LocalNote | null {
    const notes = readStore<LocalNote[]>(NOTES_KEY, []);
    return notes.find((n) => n.id === id) ?? null;
  },

  /** 获取某节经文的所有笔记。 */
  getForVerse(book: string, chapter: number, verse: number): LocalNote[] {
    const notes = readStore<LocalNote[]>(NOTES_KEY, []);
    return notes
      .filter((n) => n.book === book && n.chapter === chapter && n.verse === verse)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  },

  /** 更新笔记内容。 */
  update(id: string, content: string): LocalNote | null {
    const notes = readStore<LocalNote[]>(NOTES_KEY, []);
    const note = notes.find((n) => n.id === id);
    if (!note) return null;
    note.content = content;
    note.updated_at = nowISO();
    writeStore(NOTES_KEY, notes);
    return note;
  },

  /** 删除笔记。 */
  remove(id: string): boolean {
    const notes = readStore<LocalNote[]>(NOTES_KEY, []);
    const idx = notes.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    notes.splice(idx, 1);
    writeStore(NOTES_KEY, notes);
    return true;
  },
};

// ── 书签 ──────────────────────────────────────────────────────────────────────

const BOOKMARKS_KEY = "bookmarks";

export const localBookmarks = {
  /** 添加书签。 */
  add(params: {
    book: string;
    chapter: number;
    verse: number;
    note?: string;
  }): LocalBookmark {
    const bookmarks = readStore<LocalBookmark[]>(BOOKMARKS_KEY, []);
    const bookmark: LocalBookmark = {
      id: generateId(),
      book: params.book,
      chapter: params.chapter,
      verse: params.verse,
      note: params.note ?? null,
      created_at: nowISO(),
    };
    bookmarks.push(bookmark);
    writeStore(BOOKMARKS_KEY, bookmarks);
    return bookmark;
  },

  /** 获取所有书签。 */
  getAll(limit: number = 50, offset: number = 0): LocalBookmark[] {
    const bookmarks = readStore<LocalBookmark[]>(BOOKMARKS_KEY, []);
    return bookmarks
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(offset, offset + limit);
  },

  /** 删除书签。 */
  remove(id: string): boolean {
    const bookmarks = readStore<LocalBookmark[]>(BOOKMARKS_KEY, []);
    const idx = bookmarks.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    bookmarks.splice(idx, 1);
    writeStore(BOOKMARKS_KEY, bookmarks);
    return true;
  },
};

// ── 存储检测 ──────────────────────────────────────────────────────────────────

/** 检查 localStorage 是否可用。 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const testKey = "__xjoy_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/** 检测是否运行在静态部署模式（无后端 API）。 */
let _isStaticMode: boolean | null = null;

export async function detectStaticMode(): Promise<boolean> {
  if (_isStaticMode !== null) return _isStaticMode;

  try {
    const resp = await fetch("/api/health");
    _isStaticMode = !resp.ok;
  } catch {
    // 网络错误或 API 不可用 → 静态模式
    _isStaticMode = true;
  }

  return _isStaticMode;
}

/** 手动设置静态模式（跳过自动检测）。 */
export function setStaticMode(value: boolean): void {
  _isStaticMode = value;
}
