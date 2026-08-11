/**
 * 本地内存级 KJV 经文搜索引擎 — Neon 数据库回退方案。
 *
 * 当 PostgreSQL（Neon）不可用时，使用 data/kjv.json 提供经文检索。
 * 实现基于关键词匹配和 TF-IDF 风格评分的全文搜索。
 *
 * 数据加载策略：
 * - 首次调用时从文件系统加载（~5.5MB，约 100ms）
 * - 加载后缓存在内存中，后续调用零延迟
 * - 适合 serverless 冷启动场景（测试阶段 5-10 用户可接受）
 */

import * as fs from "fs";
import * as path from "path";
import type { Verse, VerseSearchResult } from "@xjoy/shared";

// ── 数据结构 ────────────────────────────────────────────────────────────────

interface KjvData {
  meta: {
    source: string;
    fetchedAt: string;
    totalBooks: number;
    totalChapters: number;
    totalVerses: number;
  };
  verses: Verse[];
}

interface VerseIndex {
  /** book -> chapter -> verse number -> Verse */
  byRef: Map<string, Map<number, Map<number, Verse>>>;
  /** book -> ordered list of chapters */
  books: Map<string, number[]>;
  /** word -> Set<verse index> 倒排索引 */
  invertedIndex: Map<string, Set<number>>;
  /** 单词 -> 包含该词的经文数（用于 IDF 计算） */
  documentFrequency: Map<string, number>;
  /** 所有经文的数组（用于按索引查找） */
  verseList: Verse[];
  /** 经文总数 */
  totalVerses: number;
}

// ── 全局缓存 ────────────────────────────────────────────────────────────────

let index: VerseIndex | null = null;
let loadError: Error | null = null;

// ── 停用词 ──────────────────────────────────────────────────────────────────

/**
 * 英文停用词 — 搜索时过滤掉这些高频词以提升准确性。
 * 注意：特意不包含 KJV 特有的古语词（thee, thou, thy, shalt 等），
 * 因为这些词在经文中具有区分性。
 */
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
  "under", "again", "also", "very", "just", "too", "very", "there",
]);

/**
 * KJV 经文中非常高频率但在搜索中不可区分的词。
 * 这些词在几乎所有经文中出现，会产生大量噪音。
 */
const HIGH_FREQUENCY_BIBLICAL = new Set([
  "unto", "thou", "thy", "thee", "hath", "ye", "saith", "shalt",
  "therefore", "behold", "hast", "doth", "thereof", "thus",
]);

// ── 数据加载 ────────────────────────────────────────────────────────────────

/**
 * 查找 kjv.json 的数据路径。
 *
 * 尝试多个可能位置：
 * 1. KJV_DATA_PATH 环境变量（生产环境推荐）
 * 2. 项目根目录 data/kjv.json
 * 3. 相对于 packages/app 的 ../data/kjv.json
 */
function resolveDataPath(): string {
  // 环境变量优先
  const envPath = process.env.KJV_DATA_PATH;
  // turbopackIgnore: 运行时数据文件路径 — 静态分析会导致全项目追踪
  if (envPath && /* turbopackIgnore: true */ fs.existsSync(envPath)) return envPath;

  // 尝试常见位置 — 与 packages/shared/src/bible.ts 保持一致的路径解析
  const candidates = [
    path.resolve(process.cwd(), "data", "kjv.json"),                      // root (Vercel, Fly.io)
    path.resolve(process.cwd(), "packages", "app", "data", "kjv.json"),   // root → app copy (Vercel alternate)
    path.resolve(process.cwd(), "..", "..", "data", "kjv.json"),          // from packages/app (local dev)
  ];

  for (const p of candidates) {
    if (fs.existsSync(/* turbopackIgnore: true */ p)) return p;
  }

  throw new Error(
    "找不到 data/kjv.json。请设置 KJV_DATA_PATH 环境变量指向 KJV JSON 数据文件。"
  );
}

/**
 * 加载 KJV 数据并构建搜索索引。
 * 结果缓存在内存中，后续调用直接返回。
 */
function loadIndex(): VerseIndex {
  if (index) return index;
  if (loadError) throw loadError;

  try {
    const dataPath = resolveDataPath();
    // turbopackIgnore: 运行时加载数据文件；process.cwd() 的静态分析
    // 会导致全项目追踪，超出 Vercel 部署体积限制。
    const raw = fs.readFileSync(/* turbopackIgnore: true */ dataPath, "utf-8");
    const data: KjvData = JSON.parse(raw);

    const byRef = new Map<string, Map<number, Map<number, Verse>>>();
    const books = new Map<string, number[]>();
    const invertedIndex = new Map<string, Set<number>>();
    const df = new Map<string, number>();
    const verseList: Verse[] = data.verses;

    // 构建索引
    for (let i = 0; i < verseList.length; i++) {
      const v = verseList[i];

      // 引用索引: book -> chapter -> verse
      if (!byRef.has(v.book)) {
        byRef.set(v.book, new Map());
        books.set(v.book, []);
      }
      const chapters = byRef.get(v.book)!;
      if (!chapters.has(v.chapter)) {
        chapters.set(v.chapter, new Map());
        books.get(v.book)!.push(v.chapter);
      }
      chapters.get(v.chapter)!.set(v.verse, v);

      // 倒排索引: word -> Set<verse index>
      const tokens = tokenize(v.text);
      const seenTokens = new Set<string>();
      for (const token of tokens) {
        if (seenTokens.has(token)) continue; // 每节经文每个词只计一次（TF）
        seenTokens.add(token);

        if (!invertedIndex.has(token)) {
          invertedIndex.set(token, new Set());
        }
        invertedIndex.get(token)!.add(i);

        // 文档频率
        df.set(token, (df.get(token) || 0) + 1);
      }
    }

    // 每个 book 的 chapters 去重并排序
    for (const [book, chaps] of books) {
      books.set(book, [...new Set(chaps)].sort((a, b) => a - b));
    }

    index = {
      byRef,
      books,
      invertedIndex,
      documentFrequency: df,
      verseList,
      totalVerses: verseList.length,
    };

    console.log(
      `[local-search] 索引构建完成: ${index.totalVerses} 节经文, ` +
      `${index.invertedIndex.size} 个唯一词, ${index.books.size} 卷书`
    );

    return index;
  } catch (err) {
    loadError = err instanceof Error ? err : new Error(String(err));
    throw loadError;
  }
}

// ── 分词 ────────────────────────────────────────────────────────────────────

/**
 * 将经文文本分词为小写词干列表。
 * 移除标点、停用词和高频圣经词。
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ") // 保留字母、数字、空格、连字符、撇号
    .split(/\s+/)
    .filter((w) => {
      if (w.length < 2) return false;
      if (STOP_WORDS.has(w)) return false;
      if (HIGH_FREQUENCY_BIBLICAL.has(w)) return false;
      return true;
    });
}

// ── 搜索 ────────────────────────────────────────────────────────────────────

/**
 * 计算查询词与经文索引的匹配分数。
 *
 * 使用 TF-IDF 启发式算法：
 * - TF：查询词在经文中出现的次数（经文中出现越多，分数越高）
 * - IDF：该词在整个经文中出现的文档频率越低，权重越高
 * - 精确短语匹配获得额外加分
 */
function searchByTokens(
  queryTokens: string[],
  idx: VerseIndex,
  limit: number
): VerseSearchResult[] {
  const scores = new Map<number, number>();

  for (const token of queryTokens) {
    const verseSet = idx.invertedIndex.get(token);
    if (!verseSet) continue;

    const idf = Math.log(
      (idx.totalVerses + 1) / ((idx.documentFrequency.get(token) || 0) + 1)
    );

    for (const verseIdx of verseSet) {
      const currentScore = scores.get(verseIdx) || 0;
      // TF (binary) × IDF — 每个词在经文中最多计一次
      scores.set(verseIdx, currentScore + idf);
    }
  }

  if (scores.size === 0) return [];

  // 转换为数组并排序
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

  results.sort((a, b) => b.rank - a.rank);
  return results.slice(0, limit);
}

/**
 * 检查经文是否包含精确短语匹配（连续单词序列）。
 * 短语匹配的经文获得额外加分。
 */
function boostPhraseMatches(
  results: VerseSearchResult[],
  cleanQuery: string
): void {
  const queryLower = cleanQuery.toLowerCase();
  const words = queryLower.split(/\s+/).filter((w) => w.length > 2);

  for (const r of results) {
    const textLower = r.text.toLowerCase();
    // 精确短语匹配
    if (textLower.includes(queryLower)) {
      r.rank *= 2.0;
      continue;
    }
    // 部分短语匹配（任意 2 个连续词）
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = words[i] + " " + words[i + 1];
      if (textLower.includes(phrase)) {
        r.rank *= 1.5;
        break;
      }
    }
  }

  // 重新排序
  results.sort((a, b) => b.rank - a.rank);
}

// ── 公开 API ────────────────────────────────────────────────────────────────

/**
 * 本地关键词搜索经文。
 *
 * 当 PostgreSQL 全文搜索不可用时使用。
 * 搜索策略：
 * 1. 查询分词（移除停用词）
 * 2. 在倒排索引中查找每个词的匹配经文
 * 3. 使用 TF-IDF 评分
 * 4. 精确短语匹配加权
 * 5. 返回 top-N 结果
 */
export function localSearchVerses(
  query: string,
  limit: number = 12
): VerseSearchResult[] {
  const idx = loadIndex();
  const tokens = tokenize(query);

  if (tokens.length === 0) return [];

  const results = searchByTokens(tokens, idx, limit * 2); // 获取双倍以便短语过滤

  // 短语匹配加权
  boostPhraseMatches(results, query);

  return results.slice(0, limit);
}

/**
 * 本地精确查找单节经文。
 */
export function localGetVerse(
  book: string,
  chapter: number,
  verse: number
): Verse | null {
  const idx = loadIndex();
  const chapters = idx.byRef.get(book);
  if (!chapters) return null;
  const verses = chapters.get(chapter);
  if (!verses) return null;
  return verses.get(verse) ?? null;
}

/**
 * 本地获取整章经文。
 */
export function localGetChapter(book: string, chapter: number): Verse[] {
  const idx = loadIndex();
  const chapters = idx.byRef.get(book);
  if (!chapters) return [];
  const verses = chapters.get(chapter);
  if (!verses) return [];
  return Array.from(verses.values()).sort((a, b) => a.verse - b.verse);
}

/**
 * 获取所有书卷列表。
 */
export function localGetBooks(): string[] {
  const idx = loadIndex();
  const books = Array.from(idx.books.keys());

  // 按传统 KJV 顺序排列（大致顺序）
  const traditionalOrder = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
    "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles",
    "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
    "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah",
    "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
    "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah",
    "Haggai", "Zechariah", "Malachi",
    "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
    "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
    "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
    "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews",
    "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John",
    "Jude", "Revelation",
  ];

  // 按传统顺序排列实际存在的书卷
  const bookSet = new Set(books);
  const ordered = traditionalOrder.filter((b) => bookSet.has(b));
  // 添加任何不在传统顺序中的书卷
  for (const b of books) {
    if (!ordered.includes(b)) ordered.push(b);
  }
  return ordered;
}

/**
 * 检查本地搜索是否可用（数据文件是否存在）。
 * 用于决定是否启用回退。
 */
export function isLocalSearchAvailable(): boolean {
  try {
    resolveDataPath();
    return true;
  } catch {
    return false;
  }
}

/**
 * 重置索引缓存（主要用于测试）。
 */
export function resetLocalIndex(): void {
  index = null;
  loadError = null;
}
