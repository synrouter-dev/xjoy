/** Core domain types shared across all Xjoy packages. */

export interface Verse {
  id?: number;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface VerseSearchResult extends Verse {
  rank: number;
}

export interface Citation {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface CrossRef {
  from_book: string;
  from_chapter: number;
  from_verse: number;
  to_book: string;
  to_chapter: number;
  to_verse_start: number;
  to_verse_end: number;
  votes: number;
}

export interface VerseCitation {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BookMeta {
  name: string;
  chapters: number;
  testament: "old" | "new";
  section: string;
}

// ── 笔记（Notes）──────────────────────────────────────────────────────────

/** 一条用户笔记，关联到特定经文引用。 */
export interface Note {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  content: string;
  created_at: string;
  updated_at: string;
}

/** 创建笔记的输入参数。 */
export interface CreateNoteInput {
  book: string;
  chapter: number;
  verse: number;
  content: string;
}

/** 更新笔记的输入参数。 */
export interface UpdateNoteInput {
  id: number;
  content: string;
}

// ── 书签（Bookmarks）──────────────────────────────────────────────────────

/** 一条用户书签，标记特定经文引用。 */
export interface Bookmark {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  note: string | null;
  created_at: string;
}

/** 添加书签的输入参数。 */
export interface AddBookmarkInput {
  book: string;
  chapter: number;
  verse: number;
  note?: string;
}

// ── 阅读进度（Reading Progress）──────────────────────────────────────────

/** 一条阅读记录，标记某章已被阅读。 */
export interface ReadingRecord {
  id: number;
  book: string;
  chapter: number;
  read_at: string;
}

/** 阅读统计概览。 */
export interface ReadingStats {
  total_chapters_read: number;
  total_books_started: number;
  last_read_book: string | null;
  last_read_chapter: number | null;
  last_read_at: string | null;
}
