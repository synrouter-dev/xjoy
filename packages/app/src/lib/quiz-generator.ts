/**
 * Bible Quiz Generator
 *
 * 纯本地题目生成器，基于内存中的 KJV JSON 数据。
 * 不依赖外部 API —— 所有题目在服务端生成。
 *
 * 题目类型：
 *   - book_origin:   显示一节经文，猜出自哪卷书
 *   - fill_blank:    显示部分经文（遮盖关键词），选正确的原文
 *   - next_verse:    显示一节经文，问下一节的内容
 *   - chapter_context: 显示一节经文，猜它属于第几章
 */

import { getVerse, getBooks } from "@xjoy/shared";
import type { BookMeta } from "@xjoy/shared";

// ── Types ──────────────────────────────────────────────────────────────────────

/** 题目难度 */
export type Difficulty = "easy" | "medium" | "hard";

/** 题目类型 */
export type QuestionType =
  | "book_origin"
  | "fill_blank"
  | "next_verse"
  | "chapter_context";

/** 单个选项 */
export interface QuizOption {
  label: string; // A, B, C, D
  text: string;
}

/** 一道题目 */
export interface QuizQuestion {
  id: number;
  type: QuestionType;
  difficulty: Difficulty;
  /** 题干（Markdown 格式的经文引用或提示） */
  prompt: string;
  /** 完整的参考经文（用于展示上下文） */
  reference: string;
  /** 四个选项 */
  options: QuizOption[];
  /** 正确答案的 label（A, B, C, D） */
  correctAnswer: string;
  /** 正确答案的经文文本（用于答案解释） */
  explanation: string;
}

/** 一轮测验 */
export interface QuizSession {
  questions: QuizQuestion[];
  difficulty: Difficulty;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * 从 BOOKS 列表中随机选取 N 个不同的书卷。
 * 排除指定的书卷（如正确答案所在的书卷）。
 */
function pickRandomBooks(
  count: number,
  exclude: string[] = []
): BookMeta[] {
  const books = getBooks();
  const pool = books.filter((b) => !exclude.includes(b.name));
  return shuffle(pool).slice(0, count);
}

/**
 * Fisher-Yates 洗牌。
 */
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 随机整数 [min, max]。
 */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 获取指定章节的随机经文。
 * 用于基于当前阅读章节生成题目。
 */
function pickVerseFromChapter(
  book: string,
  chapter: number
): { book: string; chapter: number; verse: number; text: string } | null {
  // 从该章节中随机选一节
  for (let retry = 0; retry < 15; retry++) {
    const verse = randInt(1, 30);
    const verseData = getVerse(book, chapter, verse);
    if (verseData) {
      return { book, chapter, verse, text: verseData.text };
    }
  }
  return null;
}

/**
 * 获取一节随机经文。
 * difficulty 影响选取范围：
 *   - easy: 热门书卷（诗篇、马太、约翰、罗马等）+ 前几章
 *   - medium: 全经范围，但优先常见章节
 *   - hard: 完全随机
 */
function pickRandomVerse(
  difficulty: Difficulty
): { book: string; chapter: number; verse: number; text: string } {
  const books = getBooks();

  const easyBooks = [
    "Psalms", "Matthew", "John", "Romans", "Genesis",
    "Proverbs", "Luke", "Acts", "1 Corinthians", "Isaiah",
  ];

  let pool: BookMeta[];
  if (difficulty === "easy") {
    pool = books.filter((b) => easyBooks.includes(b.name));
  } else {
    pool = books;
  }

  const book = pool[randInt(0, pool.length - 1)];

  // easy: 前 1/3 章节, medium: 前 2/3, hard: 全部
  let maxChapter = book.chapters;
  if (difficulty === "easy") maxChapter = Math.max(1, Math.ceil(book.chapters / 3));
  else if (difficulty === "medium") maxChapter = Math.max(1, Math.ceil((book.chapters * 2) / 3));

  const chapter = randInt(1, maxChapter);

  // 从该章节中随机选一节
  const verse = randInt(1, 15); // 大部分章节不超过 30 节，随机选前 15 节增加命中率
  const verseData = getVerse(book.name, chapter, verse);

  if (verseData) {
    return { book: book.name, chapter, verse, text: verseData.text };
  }

  // fallback: 重试
  for (let retry = 0; retry < 10; retry++) {
    const b = pool[randInt(0, pool.length - 1)];
    const ch = randInt(1, Math.min(b.chapters, 15));
    const vs = randInt(1, 10);
    const v = getVerse(b.name, ch, vs);
    if (v) return { book: b.name, chapter: ch, verse: vs, text: v.text };
  }

  // 最终兜底：Genesis 1:1
  const fallback = getVerse("Genesis", 1, 1)!;
  return { book: "Genesis", chapter: 1, verse: 1, text: fallback.text };
}

/**
 * 将经文文本中的关键词遮蔽，生成填空题目。
 * 选择文本中最长的单词或短语作为空白。
 */
function maskKeyword(text: string): { masked: string; keyword: string } {
  const words = text.split(/\s+/);
  if (words.length < 4) {
    // 句子太短，遮蔽最后一个词
    const keyword = words[words.length - 1];
    return {
      masked: words.slice(0, -1).join(" ") + " ______",
      keyword,
    };
  }

  // 选择一个长度适中的词（不是 the/and/of 等常见词）
  const contentWords = words
    .map((w, i) => ({ word: w.replace(/[.,;:!?]$/, ""), raw: w, index: i }))
    .filter(
      (w) =>
        w.word.length >= 4 &&
        !["that", "which", "they", "them", "their", "have", "from"].includes(
          w.word.toLowerCase()
        )
    );

  if (contentWords.length === 0) {
    const mid = Math.floor(words.length / 2);
    return {
      masked: words
        .map((w, i) => (i === mid ? "______" : w))
        .join(" "),
      keyword: words[mid],
    };
  }

  const picked = contentWords[randInt(0, contentWords.length - 1)];
  const masked = words
    .map((w, i) => (i === picked.index ? "______" : w))
    .join(" ");

  return { masked, keyword: picked.raw.replace(/[.,;:!?]$/, "") };
}

// ── Question Generators ────────────────────────────────────────────────────────

/**
 * 生成一道「经文归属」题：显示经文内容，猜出自哪卷书。
 */
function generateBookOrigin(difficulty: Difficulty, id: number): QuizQuestion {
  const verse = pickRandomVerse(difficulty);
  const distractors = pickRandomBooks(3, [verse.book]);

  const options = shuffle([
    { label: "A", text: verse.book },
    ...distractors.map((b, i) => ({
      label: String.fromCharCode(66 + i), // B, C, D
      text: b.name,
    })),
  ]);

  return {
    id,
    type: "book_origin",
    difficulty,
    prompt: `这节经文出自圣经的哪一卷书？\n\n> *"${verse.text}"*`,
    reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
    options: options.sort((a, b) => a.label.localeCompare(b.label)),
    correctAnswer: options.find((o) => o.text === verse.book)!.label,
    explanation: `${verse.book} ${verse.chapter}:${verse.verse}`,
  };
}

/**
 * 生成一道「填空补全」题：遮蔽经文中的关键词，选择正确原文。
 */
function generateFillBlank(difficulty: Difficulty, id: number): QuizQuestion {
  const verse = pickRandomVerse(difficulty);
  const { masked, keyword } = maskKeyword(verse.text);

  // 生成干扰项：从同章节或随机经文中选取类似长度的词
  const distractors = generateFillBlankDistractors(verse, keyword);

  const options = shuffle([
    { label: "A", text: keyword },
    ...distractors.map((d, i) => ({
      label: String.fromCharCode(66 + i),
      text: d,
    })),
  ]);

  return {
    id,
    type: "fill_blank",
    difficulty,
    prompt: `请选择正确的词填入空白处：\n\n> *"${masked}"*`,
    reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
    options: options.sort((a, b) => a.label.localeCompare(b.label)),
    correctAnswer: options.find((o) => o.text === keyword)!.label,
    explanation: `${verse.book} ${verse.chapter}:${verse.verse} — "${verse.text}"`,
  };
}

/**
 * 为填空题目生成干扰项。
 */
function generateFillBlankDistractors(
  verse: { book: string; chapter: number; verse: number },
  keyword: string
): string[] {
  const distractors: string[] = [];
  const chapterVerses: string[] = [];

  // 收集同章节的其他经文文本
  for (let v = 1; v <= Math.min(20, verse.verse + 5); v++) {
    if (v === verse.verse) continue;
    const vData = getVerse(verse.book, verse.chapter, v);
    if (vData) chapterVerses.push(vData.text);
  }

  // 从同章节经文中提取长度相近的词
  const allWords: string[] = [];
  for (const text of chapterVerses) {
    const words = text.split(/\s+/).map((w) => w.replace(/[.,;:!?]$/, ""));
    allWords.push(
      ...words.filter(
        (w) =>
          w.length >= keyword.length - 2 &&
          w.length <= keyword.length + 3 &&
          w.toLowerCase() !== keyword.toLowerCase()
      )
    );
  }

  // 去重并随机选取 3 个
  const unique = [...new Set(allWords)];
  const picked = shuffle(unique).slice(0, 3);

  // 如果不够 3 个，用常见圣经词汇填补
  const fallbackWords = [
    "righteousness", "salvation", "everlasting", "commandment",
    "testimony", "covenant", "sanctuary", "redemption",
    "wisdom", "judgment", "mercy", "glory",
  ];
  while (picked.length < 3) {
    const fw = fallbackWords[randInt(0, fallbackWords.length - 1)];
    if (!picked.includes(fw) && fw.toLowerCase() !== keyword.toLowerCase()) {
      picked.push(fw);
    }
  }

  return picked.slice(0, 3);
}

/**
 * 生成一道「上下文接龙」题：显示一节经文，问下一节是什么。
 */
function generateNextVerse(difficulty: Difficulty, id: number): QuizQuestion {
  const verse = pickRandomVerse(difficulty);

  // 获取正确答案（下一节）
  const nextVerse = getVerse(verse.book, verse.chapter, verse.verse + 1);
  if (!nextVerse) {
    // 如果是章节末尾，回退到前一节
    const prevVerse = getVerse(verse.book, verse.chapter, verse.verse - 1);
    if (!prevVerse) {
      return generateBookOrigin(difficulty, id); // fallback
    }
    // 生成干扰项
    const distractors = generateNextVerseDistractors(verse.book, verse.chapter, prevVerse.text);
    const options = shuffle([
      { label: "A", text: prevVerse.text },
      ...distractors.map((d, i) => ({
        label: String.fromCharCode(66 + i),
        text: d,
      })),
    ]);

    return {
      id,
      type: "next_verse",
      difficulty,
      prompt: `以下经文的前一节是什么？\n\n> *"${verse.text}"*\n\n（${verse.book} ${verse.chapter}:${verse.verse}）`,
      reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
      options: options.sort((a, b) => a.label.localeCompare(b.label)),
      correctAnswer: options.find((o) => o.text === prevVerse.text)!.label,
      explanation: `${verse.book} ${verse.chapter}:${verse.verse - 1} — "${prevVerse.text}"`,
    };
  }

  const distractors = generateNextVerseDistractors(verse.book, verse.chapter, nextVerse.text);
  const options = shuffle([
    { label: "A", text: nextVerse.text },
    ...distractors.map((d, i) => ({
      label: String.fromCharCode(66 + i),
      text: d,
    })),
  ]);

  return {
    id,
    type: "next_verse",
    difficulty,
    prompt: `紧接这节经文的下一节是什么？\n\n> *"${verse.text}"*\n\n（${verse.book} ${verse.chapter}:${verse.verse}）`,
    reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
    options: options.sort((a, b) => a.label.localeCompare(b.label)),
    correctAnswer: options.find((o) => o.text === nextVerse.text)!.label,
    explanation: `${verse.book} ${verse.chapter}:${verse.verse + 1} — "${nextVerse.text}"`,
  };
}

/**
 * 为「上下文接龙」题目生成干扰项。
 */
function generateNextVerseDistractors(
  book: string,
  chapter: number,
  correctText: string
): string[] {
  const distractors: string[] = [];
  const books = getBooks();

  // 从不同章节随机选取经文作为干扰项
  for (let i = 0; i < 15; i++) {
    const b = books[randInt(0, books.length - 1)];
    const ch = randInt(1, Math.min(b.chapters, 20));
    const vs = randInt(1, 10);
    const v = getVerse(b.name, ch, vs);
    if (v && v.text !== correctText && !distractors.includes(v.text)) {
      distractors.push(v.text);
    }
    if (distractors.length >= 3) break;
  }

  return distractors.slice(0, 3);
}

/**
 * 生成一道「章节定位」题：显示经文片段，猜它属于第几章。
 */
function generateChapterContext(difficulty: Difficulty, id: number): QuizQuestion {
  const verse = pickRandomVerse(
    difficulty === "easy" ? "easy" : "medium"
  );

  // 选取一个有多章的书卷
  const books = getBooks();
  const bookMeta = books.find((b) => b.name === verse.book);
  const totalChapters = bookMeta?.chapters || 10;

  // 正确答案
  const correctChapter = verse.chapter;

  // 生成干扰章节（同书卷内）
  const chapterPool: number[] = [];
  for (let c = 1; c <= totalChapters; c++) {
    if (c !== correctChapter) chapterPool.push(c);
  }
  const distractorChapters = shuffle(chapterPool).slice(0, 3);

  const options = shuffle([
    { label: "A", text: `第 ${correctChapter} 章` },
    ...distractorChapters.map((c, i) => ({
      label: String.fromCharCode(66 + i),
      text: `第 ${c} 章`,
    })),
  ]);

  return {
    id,
    type: "chapter_context",
    difficulty,
    prompt: `这节经文出自《${verse.book}》的哪一章？\n\n> *"${verse.text}"*`,
    reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
    options: options.sort((a, b) => a.label.localeCompare(b.label)),
    correctAnswer: options.find(
      (o) => o.text === `第 ${correctChapter} 章`
    )!.label,
    explanation: `${verse.book} ${correctChapter}:${verse.verse}`,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

/** 所有题目生成器 */
const GENERATORS: Record<QuestionType, (d: Difficulty, id: number) => QuizQuestion> = {
  book_origin: generateBookOrigin,
  fill_blank: generateFillBlank,
  next_verse: generateNextVerse,
  chapter_context: generateChapterContext,
};

/** 所有题目类型列表 */
const ALL_TYPES: QuestionType[] = [
  "book_origin",
  "fill_blank",
  "next_verse",
  "chapter_context",
];

/**
 * 生成一轮测验（10 道题）。
 * 题目类型均匀分布，难度可指定。
 *
 * @param difficulty - 难度等级
 * @param questionCount - 题目数量（默认 10）
 * @param book - 可选：限定在某卷书内出题
 * @param chapter - 可选：限定在某章内出题（需同时指定 book）
 */
export function generateQuiz(
  difficulty: Difficulty = "medium",
  questionCount: number = 10,
  book?: string,
  chapter?: number
): QuizSession {
  const questions: QuizQuestion[] = [];

  // 如果指定了 book，使用章节限定的生成器
  if (book) {
    return generateChapterQuiz(difficulty, questionCount, book, chapter);
  }

  // 全局随机模式
  const types = shuffle([...ALL_TYPES]);
  for (let i = 0; i < questionCount; i++) {
    const type = types[i % types.length];
    const question = GENERATORS[type](difficulty, i + 1);
    questions.push(question);
  }

  return {
    questions: shuffle(questions),
    difficulty,
  };
}

/**
 * 基于指定章节生成测验题目。
 * 所有题目均出自指定书卷（和章节，若提供）。
 */
function generateChapterQuiz(
  difficulty: Difficulty,
  questionCount: number,
  book: string,
  chapter?: number
): QuizSession {
  const questions: QuizQuestion[] = [];
  const books = getBooks();
  const bookMeta = books.find((b) => b.name === book);
  if (!bookMeta) {
    // 回退到全局模式
    return generateQuiz(difficulty, questionCount);
  }

  const targetChapter = chapter || randInt(1, bookMeta.chapters);

  // 收集目标章节的所有经文
  const chapterVerses: { verse: number; text: string }[] = [];
  for (let v = 1; v <= 40; v++) {
    const vData = getVerse(book, targetChapter, v);
    if (vData) chapterVerses.push({ verse: v, text: vData.text });
    else if (chapterVerses.length > 0 && v > chapterVerses[chapterVerses.length - 1].verse + 5) break;
  }

  if (chapterVerses.length < 3) {
    // 经文太少，回退到全局模式
    return generateQuiz(difficulty, questionCount);
  }

  // 生成题目
  const types = shuffle([...ALL_TYPES]);
  for (let i = 0; i < questionCount; i++) {
    const type = types[i % types.length];
    let verse: { book: string; chapter: number; verse: number; text: string };

    // 从目标章节随机选一节
    const picked = chapterVerses[randInt(0, chapterVerses.length - 1)];
    verse = { book, chapter: targetChapter, verse: picked.verse, text: picked.text };

    const question = generateQuestionFromVerse(type, difficulty, verse, bookMeta, i + 1);
    questions.push(question);
  }

  return {
    questions: shuffle(questions),
    difficulty,
  };
}

/**
 * 从指定经文生成一道题目。
 */
function generateQuestionFromVerse(
  type: QuestionType,
  difficulty: Difficulty,
  verse: { book: string; chapter: number; verse: number; text: string },
  bookMeta: { name: string; chapters: number },
  id: number
): QuizQuestion {
  switch (type) {
    case "book_origin":
      return generateBookOriginFromVerse(verse, bookMeta, id);
    case "fill_blank":
      return generateFillBlankFromVerse(verse, id);
    case "next_verse":
      return generateNextVerseFromVerse(verse, difficulty, id);
    case "chapter_context":
      return generateChapterContextFromVerse(verse, bookMeta, id);
    default:
      return generateBookOriginFromVerse(verse, bookMeta, id);
  }
}

function generateBookOriginFromVerse(
  verse: { book: string; chapter: number; verse: number; text: string },
  bookMeta: { name: string; chapters: number },
  id: number
): QuizQuestion {
  const distractors = pickRandomBooks(3, [verse.book]);
  const options = shuffle([
    { label: "A", text: verse.book },
    ...distractors.map((b, i) => ({
      label: String.fromCharCode(66 + i),
      text: b.name,
    })),
  ]);

  return {
    id,
    type: "book_origin",
    difficulty: "medium",
    prompt: `这节经文出自圣经的哪一卷书？\n\n> *"${verse.text}"*`,
    reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
    options: options.sort((a, b) => a.label.localeCompare(b.label)),
    correctAnswer: options.find((o) => o.text === verse.book)!.label,
    explanation: `${verse.book} ${verse.chapter}:${verse.verse}`,
  };
}

function generateFillBlankFromVerse(
  verse: { book: string; chapter: number; verse: number; text: string },
  id: number
): QuizQuestion {
  const { masked, keyword } = maskKeyword(verse.text);
  const distractors = generateFillBlankDistractors(verse, keyword);
  const options = shuffle([
    { label: "A", text: keyword },
    ...distractors.map((d, i) => ({
      label: String.fromCharCode(66 + i),
      text: d,
    })),
  ]);

  return {
    id,
    type: "fill_blank",
    difficulty: "medium",
    prompt: `请选择正确的词填入空白处：\n\n> *"${masked}"*`,
    reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
    options: options.sort((a, b) => a.label.localeCompare(b.label)),
    correctAnswer: options.find((o) => o.text === keyword)!.label,
    explanation: `${verse.book} ${verse.chapter}:${verse.verse} — "${verse.text}"`,
  };
}

function generateNextVerseFromVerse(
  verse: { book: string; chapter: number; verse: number; text: string },
  difficulty: Difficulty,
  id: number
): QuizQuestion {
  const nextVerse = getVerse(verse.book, verse.chapter, verse.verse + 1);
  if (!nextVerse) {
    return generateBookOriginFromVerse(verse, { name: verse.book, chapters: 150 }, id);
  }

  const distractors = generateNextVerseDistractors(verse.book, verse.chapter, nextVerse.text);
  const options = shuffle([
    { label: "A", text: nextVerse.text },
    ...distractors.map((d, i) => ({
      label: String.fromCharCode(66 + i),
      text: d,
    })),
  ]);

  return {
    id,
    type: "next_verse",
    difficulty,
    prompt: `紧接这节经文的下一节是什么？\n\n> *"${verse.text}"*\n\n（${verse.book} ${verse.chapter}:${verse.verse}）`,
    reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
    options: options.sort((a, b) => a.label.localeCompare(b.label)),
    correctAnswer: options.find((o) => o.text === nextVerse.text)!.label,
    explanation: `${verse.book} ${verse.chapter}:${verse.verse + 1} — "${nextVerse.text}"`,
  };
}

function generateChapterContextFromVerse(
  verse: { book: string; chapter: number; verse: number; text: string },
  bookMeta: { name: string; chapters: number },
  id: number
): QuizQuestion {
  const totalChapters = bookMeta.chapters || 10;
  const correctChapter = verse.chapter;

  const chapterPool: number[] = [];
  for (let c = 1; c <= totalChapters; c++) {
    if (c !== correctChapter) chapterPool.push(c);
  }
  const distractorChapters = shuffle(chapterPool).slice(0, 3);

  const options = shuffle([
    { label: "A", text: `第 ${correctChapter} 章` },
    ...distractorChapters.map((c, i) => ({
      label: String.fromCharCode(66 + i),
      text: `第 ${c} 章`,
    })),
  ]);

  return {
    id,
    type: "chapter_context",
    difficulty: "medium",
    prompt: `这节经文出自《${verse.book}》的哪一章？\n\n> *"${verse.text}"*`,
    reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
    options: options.sort((a, b) => a.label.localeCompare(b.label)),
    correctAnswer: options.find((o) => o.text === `第 ${correctChapter} 章`)!.label,
    explanation: `${verse.book} ${correctChapter}:${verse.verse}`,
  };
}

/**
 * 计算得分。
 * 每题 10 分，满分 = questionCount * 10。
 */
export function calculateScore(
  answers: { questionId: number; selectedAnswer: string }[],
  questions: QuizQuestion[]
): { score: number; total: number; correct: number; details: { questionId: number; correct: boolean }[] } {
  let correct = 0;
  const details = answers.map((a) => {
    const question = questions.find((q) => q.id === a.questionId);
    const isCorrect = question?.correctAnswer === a.selectedAnswer;
    if (isCorrect) correct++;
    return { questionId: a.questionId, correct: isCorrect };
  });

  return {
    score: correct * 10,
    total: questions.length * 10,
    correct,
    details,
  };
}
