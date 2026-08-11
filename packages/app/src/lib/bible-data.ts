/**
 * 客户端圣经数据模块 — Client-side KJV Bible Data
 *
 * 为 GitHub Pages 静态部署设计。通过 fetch() 加载 /data/kjv.json（~5.7MB），
 * 构建内存索引，提供 O(1) 经文查找和客户端全文搜索。
 *
 * 设计要点：
 * - 单例加载：首次调用 initBibleData() 时加载并缓存，后续调用零延迟
 * - 搜索：基于倒排索引 + TF-IDF 评分，纯客户端执行
 * - 兼容 shared 包 API：函数签名与 @xjoy/shared 保持一致
 */

import type { Verse, BookMeta, VerseSearchResult } from "@xjoy/shared";

// ── 类型 ──────────────────────────────────────────────────────────────────────

interface KJVData {
  meta: {
    source: string;
    fetchedAt: string;
    totalBooks: number;
    totalChapters: number;
    totalVerses: number;
  };
  verses: Verse[];
}

interface BibleIndex {
  /** "Book|Chapter" → Verse[]（保持经文顺序） */
  byBookChapter: Map<string, Verse[]>;
  /** "Book|Chapter|Verse" → Verse */
  byVerse: Map<string, Verse>;
  /** 倒排索引：word → Set<verseIndex> */
  invertedIndex: Map<string, Set<number>>;
  /** 单词 → 包含该词的经文数（IDF 计算用） */
  documentFrequency: Map<string, number>;
  /** 所有经文的数组（按索引查找） */
  verseList: Verse[];
  /** 经文总数 */
  totalVerses: number;
}

// ── 书卷元数据（与 @xjoy/shared 同步） ─────────────────────────────────────

const BOOKS: BookMeta[] = [
  // 旧约 — 律法书
  { name: "Genesis", chapters: 50, testament: "old", section: "The Law" },
  { name: "Exodus", chapters: 40, testament: "old", section: "The Law" },
  { name: "Leviticus", chapters: 27, testament: "old", section: "The Law" },
  { name: "Numbers", chapters: 36, testament: "old", section: "The Law" },
  { name: "Deuteronomy", chapters: 34, testament: "old", section: "The Law" },
  // 旧约 — 历史书
  { name: "Joshua", chapters: 24, testament: "old", section: "History" },
  { name: "Judges", chapters: 21, testament: "old", section: "History" },
  { name: "Ruth", chapters: 4, testament: "old", section: "History" },
  { name: "1 Samuel", chapters: 31, testament: "old", section: "History" },
  { name: "2 Samuel", chapters: 24, testament: "old", section: "History" },
  { name: "1 Kings", chapters: 22, testament: "old", section: "History" },
  { name: "2 Kings", chapters: 25, testament: "old", section: "History" },
  { name: "1 Chronicles", chapters: 29, testament: "old", section: "History" },
  { name: "2 Chronicles", chapters: 36, testament: "old", section: "History" },
  { name: "Ezra", chapters: 10, testament: "old", section: "History" },
  { name: "Nehemiah", chapters: 13, testament: "old", section: "History" },
  { name: "Esther", chapters: 10, testament: "old", section: "History" },
  // 旧约 — 诗歌智慧书
  { name: "Job", chapters: 42, testament: "old", section: "Poetry" },
  { name: "Psalms", chapters: 150, testament: "old", section: "Poetry" },
  { name: "Proverbs", chapters: 31, testament: "old", section: "Poetry" },
  { name: "Ecclesiastes", chapters: 12, testament: "old", section: "Poetry" },
  { name: "Song of Solomon", chapters: 8, testament: "old", section: "Poetry" },
  // 旧约 — 大先知书
  { name: "Isaiah", chapters: 66, testament: "old", section: "Major Prophets" },
  { name: "Jeremiah", chapters: 52, testament: "old", section: "Major Prophets" },
  { name: "Lamentations", chapters: 5, testament: "old", section: "Major Prophets" },
  { name: "Ezekiel", chapters: 48, testament: "old", section: "Major Prophets" },
  { name: "Daniel", chapters: 12, testament: "old", section: "Major Prophets" },
  // 旧约 — 小先知书
  { name: "Hosea", chapters: 14, testament: "old", section: "Minor Prophets" },
  { name: "Joel", chapters: 3, testament: "old", section: "Minor Prophets" },
  { name: "Amos", chapters: 9, testament: "old", section: "Minor Prophets" },
  { name: "Obadiah", chapters: 1, testament: "old", section: "Minor Prophets" },
  { name: "Jonah", chapters: 4, testament: "old", section: "Minor Prophets" },
  { name: "Micah", chapters: 7, testament: "old", section: "Minor Prophets" },
  { name: "Nahum", chapters: 3, testament: "old", section: "Minor Prophets" },
  { name: "Habakkuk", chapters: 3, testament: "old", section: "Minor Prophets" },
  { name: "Zephaniah", chapters: 3, testament: "old", section: "Minor Prophets" },
  { name: "Haggai", chapters: 2, testament: "old", section: "Minor Prophets" },
  { name: "Zechariah", chapters: 14, testament: "old", section: "Minor Prophets" },
  { name: "Malachi", chapters: 4, testament: "old", section: "Minor Prophets" },
  // 新约 — 福音书
  { name: "Matthew", chapters: 28, testament: "new", section: "Gospels" },
  { name: "Mark", chapters: 16, testament: "new", section: "Gospels" },
  { name: "Luke", chapters: 24, testament: "new", section: "Gospels" },
  { name: "John", chapters: 21, testament: "new", section: "Gospels" },
  // 新约 — 历史书
  { name: "Acts", chapters: 28, testament: "new", section: "History" },
  // 新约 — 保罗书信
  { name: "Romans", chapters: 16, testament: "new", section: "Pauline Epistles" },
  { name: "1 Corinthians", chapters: 16, testament: "new", section: "Pauline Epistles" },
  { name: "2 Corinthians", chapters: 13, testament: "new", section: "Pauline Epistles" },
  { name: "Galatians", chapters: 6, testament: "new", section: "Pauline Epistles" },
  { name: "Ephesians", chapters: 6, testament: "new", section: "Pauline Epistles" },
  { name: "Philippians", chapters: 4, testament: "new", section: "Pauline Epistles" },
  { name: "Colossians", chapters: 4, testament: "new", section: "Pauline Epistles" },
  { name: "1 Thessalonians", chapters: 5, testament: "new", section: "Pauline Epistles" },
  { name: "2 Thessalonians", chapters: 3, testament: "new", section: "Pauline Epistles" },
  { name: "1 Timothy", chapters: 6, testament: "new", section: "Pauline Epistles" },
  { name: "2 Timothy", chapters: 4, testament: "new", section: "Pauline Epistles" },
  { name: "Titus", chapters: 3, testament: "new", section: "Pauline Epistles" },
  { name: "Philemon", chapters: 1, testament: "new", section: "Pauline Epistles" },
  // 新约 — 普通书信
  { name: "Hebrews", chapters: 13, testament: "new", section: "General Epistles" },
  { name: "James", chapters: 5, testament: "new", section: "General Epistles" },
  { name: "1 Peter", chapters: 5, testament: "new", section: "General Epistles" },
  { name: "2 Peter", chapters: 3, testament: "new", section: "General Epistles" },
  { name: "1 John", chapters: 5, testament: "new", section: "General Epistles" },
  { name: "2 John", chapters: 1, testament: "new", section: "General Epistles" },
  { name: "3 John", chapters: 1, testament: "new", section: "General Epistles" },
  { name: "Jude", chapters: 1, testament: "new", section: "General Epistles" },
  // 新约 — 启示录
  { name: "Revelation", chapters: 22, testament: "new", section: "Apocalypse" },
];

const BOOK_ORDER = BOOKS.map((b) => b.name);
const BOOK_MAP = new Map(BOOKS.map((b) => [b.name, b]));

// ── 停用词 ────────────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "shall", "should", "may", "might", "can", "could", "it", "its", "he",
  "him", "his", "she", "her", "they", "them", "their", "we", "us", "our",
  "you", "your", "i", "me", "my", "not", "no", "so", "if", "then", "than",
  "that", "this", "these", "those", "which", "who", "whom", "whose",
  "all", "each", "every", "both", "few", "more", "most", "other", "some",
  "such", "only", "own", "same", "into", "up", "out", "about", "over",
  "under", "again", "also", "very", "just", "too", "there",
]);

const HIGH_FREQ_BIBLICAL = new Set([
  "unto", "thou", "thy", "thee", "hath", "ye", "saith", "shalt",
  "therefore", "behold", "hast", "doth", "thereof", "thus",
]);

// ── 全局状态 ──────────────────────────────────────────────────────────────────

let _index: BibleIndex | null = null;
let _loadPromise: Promise<BibleIndex> | null = null;
let _loadError: Error | null = null;

// ── 分词 ──────────────────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => {
      if (w.length < 2) return false;
      if (STOP_WORDS.has(w)) return false;
      if (HIGH_FREQ_BIBLICAL.has(w)) return false;
      return true;
    });
}

// ── 数据加载 ──────────────────────────────────────────────────────────────────

/**
 * 从 public 目录加载 kjv.json 并构建索引。
 *
 * 加载策略：
 * - 首次调用时 fetch + 构建索引（~5.7MB 下载 + ~200ms 索引构建）
 * - 后续调用直接返回缓存
 * - 支持并发调用（通过 _loadPromise 去重）
 */
async function loadIndex(): Promise<BibleIndex> {
  if (_index) return _index;
  if (_loadError) throw _loadError;

  // 去重并发加载
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    try {
      const resp = await fetch("/data/kjv.json");
      if (!resp.ok) {
        throw new Error(`无法加载经文数据: HTTP ${resp.status}`);
      }
      const data: KJVData = await resp.json();

      const byBookChapter = new Map<string, Verse[]>();
      const byVerse = new Map<string, Verse>();
      const invertedIndex = new Map<string, Set<number>>();
      const df = new Map<string, number>();
      const verseList: Verse[] = data.verses;

      // 构建索引
      for (let i = 0; i < verseList.length; i++) {
        const v = verseList[i];

        // 书卷+章节索引
        const key = `${v.book}|${v.chapter}`;
        const arr = byBookChapter.get(key);
        if (arr) {
          arr.push(v);
        } else {
          byBookChapter.set(key, [v]);
        }

        // 书卷+章节+节索引
        byVerse.set(`${v.book}|${v.chapter}|${v.verse}`, v);

        // 倒排索引
        const tokens = tokenize(v.text);
        const seenTokens = new Set<string>();
        for (const token of tokens) {
          if (seenTokens.has(token)) continue;
          seenTokens.add(token);

          if (!invertedIndex.has(token)) {
            invertedIndex.set(token, new Set());
          }
          invertedIndex.get(token)!.add(i);
          df.set(token, (df.get(token) || 0) + 1);
        }
      }

      _index = {
        byBookChapter,
        byVerse,
        invertedIndex,
        documentFrequency: df,
        verseList,
        totalVerses: verseList.length,
      };

      console.log(
        `[bible-data] 索引构建完成: ${_index.totalVerses} 节经文, ` +
        `${_index.invertedIndex.size} 个唯一词`
      );

      return _index;
    } catch (err) {
      _loadError = err instanceof Error ? err : new Error(String(err));
      throw _loadError;
    } finally {
      _loadPromise = null;
    }
  })();

  return _loadPromise;
}

/**
 * 确保索引已加载（不阻塞，后台加载）。
 * 用于在应用启动时预热缓存。
 */
export function preloadBibleData(): void {
  loadIndex().catch(() => {
    // 静默失败 — 后续调用会重试
  });
}

// ── 公开 API：查找函数（与 @xjoy/shared 兼容） ─────────────────────────────

/** 获取所有 66 卷书的元数据，按正典顺序排列。 */
export function getBooks(): BookMeta[] {
  return BOOKS;
}

/** 获取单卷书的元数据。无效名称返回 undefined。 */
export function getBookMeta(name: string): BookMeta | undefined {
  return BOOK_MAP.get(name);
}

/** 获取指定章节的所有经文。 */
export async function getChapter(
  book: string,
  chapter: number
): Promise<Verse[]> {
  const idx = await loadIndex();
  return idx.byBookChapter.get(`${book}|${chapter}`) ?? [];
}

/** 获取单节经文。 */
export async function getVerse(
  book: string,
  chapter: number,
  verse: number
): Promise<Verse | undefined> {
  const idx = await loadIndex();
  return idx.byVerse.get(`${book}|${chapter}|${verse}`);
}

/** 获取章节内的一段经文。 */
export async function getVerseRange(
  book: string,
  chapter: number,
  startVerse: number,
  endVerse: number
): Promise<Verse[]> {
  const verses = await getChapter(book, chapter);
  return verses.filter((v) => v.verse >= startVerse && v.verse <= endVerse);
}

/** 获取前后章节引用。 */
export function getAdjacentChapters(
  book: string,
  chapter: number
): {
  prev: { book: string; chapter: number } | null;
  next: { book: string; chapter: number } | null;
} {
  const bookIdx = BOOK_ORDER.indexOf(book);
  if (bookIdx === -1) return { prev: null, next: null };

  const bookMeta = BOOK_MAP.get(book);
  if (!bookMeta) return { prev: null, next: null };

  let prev: { book: string; chapter: number } | null = null;
  let next: { book: string; chapter: number } | null = null;

  if (chapter > 1) {
    prev = { book, chapter: chapter - 1 };
  } else if (bookIdx > 0) {
    const prevBook = BOOKS[bookIdx - 1];
    prev = { book: prevBook.name, chapter: prevBook.chapters };
  }

  if (chapter < bookMeta.chapters) {
    next = { book, chapter: chapter + 1 };
  } else if (bookIdx < BOOKS.length - 1) {
    next = { book: BOOKS[bookIdx + 1].name, chapter: 1 };
  }

  return { prev, next };
}

/** 检查书卷+章节引用是否有效。 */
export function isValidReference(book: string, chapter: number): boolean {
  const meta = BOOK_MAP.get(book);
  if (!meta) return false;
  return chapter >= 1 && chapter <= meta.chapters;
}

// ── 公开 API：搜索 ───────────────────────────────────────────────────────────

/**
 * 客户端关键词搜索经文。
 *
 * 使用 TF-IDF 风格评分 + 精确短语匹配加权。
 * 纯客户端执行，无需后端。
 */
export async function searchVerses(
  query: string,
  limit: number = 20
): Promise<VerseSearchResult[]> {
  const idx = await loadIndex();
  const tokens = tokenize(query);

  if (tokens.length === 0) return [];

  // TF-IDF 评分
  const scores = new Map<number, number>();
  for (const token of tokens) {
    const verseSet = idx.invertedIndex.get(token);
    if (!verseSet) continue;

    const idf = Math.log(
      (idx.totalVerses + 1) / ((idx.documentFrequency.get(token) || 0) + 1)
    );

    for (const verseIdx of verseSet) {
      const currentScore = scores.get(verseIdx) || 0;
      scores.set(verseIdx, currentScore + idf);
    }
  }

  if (scores.size === 0) return [];

  // 转换为结果数组
  const results: VerseSearchResult[] = [];
  for (const [verseIdx, score] of scores) {
    const v = idx.verseList[verseIdx];
    results.push({
      id: verseIdx,
      book: v.book,
      chapter: v.chapter,
      verse: v.verse,
      text: v.text,
      rank: score,
    });
  }

  // 精确短语匹配加权
  boostPhraseMatches(results, query);

  return results.slice(0, limit);
}

function boostPhraseMatches(
  results: VerseSearchResult[],
  cleanQuery: string
): void {
  const queryLower = cleanQuery.toLowerCase();
  const words = queryLower.split(/\s+/).filter((w) => w.length > 2);

  for (const r of results) {
    const textLower = r.text.toLowerCase();
    if (textLower.includes(queryLower)) {
      r.rank *= 2.0;
      continue;
    }
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = words[i] + " " + words[i + 1];
      if (textLower.includes(phrase)) {
        r.rank *= 1.5;
        break;
      }
    }
  }

  results.sort((a, b) => b.rank - a.rank);
}

/** 检查圣经数据模块是否可用（数据是否已加载成功）。 */
export function isBibleDataAvailable(): boolean {
  return _index !== null;
}

/** 获取索引加载状态。 */
export function getBibleDataStatus(): "unloaded" | "loading" | "ready" | "error" {
  if (_index) return "ready";
  if (_loadError) return "error";
  if (_loadPromise) return "loading";
  return "unloaded";
}

/** 重置索引缓存（用于测试）。 */
export function resetBibleData(): void {
  _index = null;
  _loadPromise = null;
  _loadError = null;
}
