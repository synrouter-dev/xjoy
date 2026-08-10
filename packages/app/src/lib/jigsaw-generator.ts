/**
 * Weekly Jigsaw Generator
 *
 * 每周一章经文排序挑战。将一章经文拆分为片段，
 * 打乱顺序后让用户重新排列。
 *
 * 纯本地生成，基于内存中的 KJV JSON 数据。
 * 每周使用固定周数作为种子，确保同一周所有用户看到相同的题目。
 */

import { getChapter, getBooks } from "@xjoy/shared";
import type { Verse } from "@xjoy/shared";

// ── Types ──────────────────────────────────────────────────────────────────────

/** 拼图片段（可能包含多节经文） */
export interface JigsawPiece {
  id: number;
  /** 片段文本 */
  text: string;
  /** 原始位置（从 1 开始） */
  originalPosition: number;
  /** 包含的经文引用 */
  verses: string;
}

/** 拼图题目 */
export interface JigsawPuzzle {
  /** 唯一标识（基于周数） */
  id: string;
  /** 书卷名 */
  book: string;
  /** 章节 */
  chapter: number;
  /** 章节经文总数 */
  verseCount: number;
  /** 片段数量 */
  pieceCount: number;
  /** 打乱后的片段 */
  pieces: JigsawPiece[];
  /** ISO 周起始日期 */
  weekStart: string;
  /** 周数 */
  weekNumber: number;
  /** 年份 */
  year: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * 获取 ISO 周数。
 */
function getWeekNumber(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return { year: d.getUTCFullYear(), week: weekNo };
}

/**
 * 获取本周一的日期字符串。
 */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

/**
 * 基于种子的伪随机数生成器（Mulberry32）。
 * 确保同一周所有用户看到相同的题目。
 */
function seededRandom(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 基于种子的 Fisher-Yates 洗牌。
 */
function seededShuffle<T>(arr: T[], rand: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ── Weekly Selection ───────────────────────────────────────────────────────────

/**
 * 根据周数选择一章经文。
 * 66 卷书 × 各卷章节数 → 共 1,189 章。
 * 使用周数种子确保每周不同，循环遍历所有章节。
 */
function selectWeeklyChapter(
  year: number,
  week: number
): { book: string; chapter: number } {
  const books = getBooks();

  // 构建所有章节的扁平列表
  interface ChapterRef {
    book: string;
    chapter: number;
  }
  const allChapters: ChapterRef[] = [];
  for (const book of books) {
    for (let ch = 1; ch <= book.chapters; ch++) {
      allChapters.push({ book: book.name, chapter: ch });
    }
  }

  // 使用 (year * 100 + week) 作为种子选择章节
  const seed = year * 100 + week;
  const index = seed % allChapters.length;
  return allChapters[index];
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * 生成本周的拼图题目。
 */
export function generateWeeklyJigsaw(): JigsawPuzzle {
  const now = new Date();
  const { year, week } = getWeekNumber(now);
  const weekStart = getWeekStart(now);

  const { book, chapter } = selectWeeklyChapter(year, week);

  // 获取该章所有经文
  const verses = getChapter(book, chapter);

  // 根据经文数量决定分成几个片段
  // 每片 2-4 节经文，总共 4-8 片
  const pieceCount = Math.min(8, Math.max(4, Math.ceil(verses.length / 3)));
  const versesPerPiece = Math.ceil(verses.length / pieceCount);

  // 分组经文为片段
  const grouped: { id: number; verses: Verse[] }[] = [];
  for (let i = 0; i < verses.length; i += versesPerPiece) {
    const slice = verses.slice(i, i + versesPerPiece);
    grouped.push({
      id: grouped.length + 1, // temporary id, will be reassigned after shuffle
      verses: slice,
    });
  }

  // 使用周数种子打乱顺序
  const rand = seededRandom(year * 1000 + week);
  const shuffled = seededShuffle(grouped, rand);

  // 构建最终片段
  const pieces: JigsawPiece[] = [];
  for (let i = 0; i < shuffled.length; i++) {
    const group = shuffled[i];
    const firstVerse = group.verses[0];
    const lastVerse = group.verses[group.verses.length - 1];

    pieces.push({
      id: i + 1, // display id (1-based after shuffle)
      text: group.verses.map((v) => `${v.verse}. ${v.text}`).join("\n\n"),
      originalPosition: grouped.findIndex((g) => g.id === group.id) + 1,
      verses:
        firstVerse.verse === lastVerse.verse
          ? `${firstVerse.verse}`
          : `${firstVerse.verse}-${lastVerse.verse}`,
    });
  }

  return {
    id: `jigsaw-${year}-w${week}`,
    book,
    chapter,
    verseCount: verses.length,
    pieceCount: pieces.length,
    pieces,
    weekStart,
    weekNumber: week,
    year,
  };
}

/**
 * 检查用户的排序是否正确。
 * 返回准确度和完成时间评分。
 */
export function checkJigsawSolution(
  puzzle: JigsawPuzzle,
  userOrder: number[] // piece.id 的数组，按用户排列顺序
): {
  correct: boolean;
  accuracy: number; // 0-1，正确位置的片段比例
  score: number; // 0-100 综合评分
} {
  // 正确的顺序：按 originalPosition 升序
  const correctOrder = [...puzzle.pieces]
    .sort((a, b) => a.originalPosition - b.originalPosition)
    .map((p) => p.id);

  let correctPositions = 0;
  for (let i = 0; i < userOrder.length; i++) {
    if (userOrder[i] === correctOrder[i]) {
      correctPositions++;
    }
  }

  const accuracy = correctPositions / puzzle.pieces.length;
  const score = Math.round(accuracy * 100);

  return {
    correct: accuracy === 1,
    accuracy,
    score,
  };
}

/**
 * 计算拼图完成评分（含时间因素）。
 * 基础分 100，根据准确度和用时调整。
 */
export function calculateJigsawScore(
  accuracy: number,
  timeSeconds: number,
  pieceCount: number
): { score: number; grade: string } {
  // 基础分 = 准确度 * 80
  let score = Math.round(accuracy * 80);

  // 时间奖励：在 (pieceCount * 15) 秒内完成得满分
  const targetTime = pieceCount * 15;
  if (timeSeconds <= targetTime) {
    score += 20;
  } else if (timeSeconds <= targetTime * 2) {
    score += Math.round(20 * (1 - (timeSeconds - targetTime) / targetTime));
  }
  // 超过 2 倍时间不再奖励

  score = Math.min(100, Math.max(0, score));

  // 等级评定
  let grade: string;
  if (score >= 95) grade = "S — 完美！";
  else if (score >= 85) grade = "A — 优秀";
  else if (score >= 70) grade = "B — 良好";
  else if (score >= 50) grade = "C — 继续努力";
  else grade = "D — 再试一次";

  return { score, grade };
}
