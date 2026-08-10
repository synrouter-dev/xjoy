/**
 * Claude API 驱动的 Bible Quiz 题目生成器
 *
 * 使用 Claude API 预生成高质量每日题目，结果缓存到 PostgreSQL。
 * Claude 不可用时自动回退到本地生成器。
 *
 * 每日题目特性：
 *   - 每天 5 道题，同日同题（基于日期种子）
 *   - 4 种题型均匀分布
 *   - 答案选项包含经文出处，方便用户查考
 */

import type { QuizQuestion, QuizSession, Difficulty } from "./quiz-generator";
import { generateQuiz as generateLocalQuiz } from "./quiz-generator";

// ── Types ──────────────────────────────────────────────────────────────────────

interface GenerateOptions {
  /** 目标日期（YYYY-MM-DD），默认 today */
  date?: string;
  /** 题目数量，默认 5 */
  count?: number;
  /** 难度 */
  difficulty?: Difficulty;
}

// ── Claude Prompt ──────────────────────────────────────────────────────────────

/**
 * 构建 Claude 题目生成的 System Prompt。
 * 要求输出严格 JSON 格式，便于程序解析。
 */
function buildSystemPrompt(count: number, difficulty: Difficulty): string {
  return `You are a Bible quiz question generator for a KJV Bible study app. Your task is to generate ${count} multiple-choice quiz questions about the King James Version Bible.

## Question Types
Generate a mix of these 4 types:
1. **book_origin** — Show a verse text, ask which book it comes from
2. **fill_blank** — Show a verse with a keyword blanked out, ask for the correct word
3. **next_verse** — Show a verse, ask what the next verse says
4. **chapter_context** — Show a verse, ask which chapter it belongs to

## Difficulty: ${difficulty}
- easy: Well-known books (Psalms, Matthew, John, Romans, Genesis, etc.), famous verses
- medium: Any book, moderately known verses
- hard: Lesser-known books (Obadiah, Nahum, etc.), obscure verses

## Rules
- ALL verse text MUST be accurate KJV wording — do NOT paraphrase or invent verses
- Use exact KJV language: "thee", "thou", "saith", "-eth" endings, etc.
- Each question must have exactly 4 options (labeled A, B, C, D)
- The correct answer MUST be factually accurate
- Distractors should be plausible but clearly wrong to someone who knows the Bible
- Every question must include the verse reference (Book Chapter:Verse)

## Output Format
Return ONLY a valid JSON array. No markdown, no explanation. Each question object:
{
  "type": "book_origin|fill_blank|next_verse|chapter_context",
  "prompt": "The question text shown to the user (can include markdown-formatted verse quote)",
  "reference": "Book Chapter:Verse",
  "options": [
    {"label": "A", "text": "Option A text"},
    {"label": "B", "text": "Option B text"},
    {"label": "C", "text": "Option C text"},
    {"label": "D", "text": "Option D text"}
  ],
  "correctAnswer": "A",
  "explanation": "Brief explanation with verse reference"
}

Return exactly ${count} questions as a JSON array.`;
}

/**
 * 构建用户消息（提供当日上下文和变化提示）。
 */
function buildUserMessage(date: string, count: number): string {
  const dayOfYear = getDayOfYear(new Date(date));
  return `Generate ${count} KJV Bible quiz questions for ${date} (day ${dayOfYear} of the year).
Make the questions diverse — vary the books, chapters, and question types.
Do NOT repeat the same well-known verses everyone uses. Be creative with your selections.`;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

// ── Claude Generation ──────────────────────────────────────────────────────────

/**
 * 调用 Claude API 生成题目。
 * 返回解析后的 QuizQuestion 数组，失败返回 null。
 */
async function generateWithClaude(
  date: string,
  count: number,
  difficulty: Difficulty
): Promise<QuizQuestion[] | null> {
  try {
    // 动态导入 Claude API 模块（避免在没有 API key 时构建失败）
    const { generateResponse } = await import("@xjoy/api");

    const systemPrompt = buildSystemPrompt(count, difficulty);
    const userMessage = buildUserMessage(date, count);

    const result = await generateResponse(systemPrompt, userMessage, {
      maxTokens: 4096,
      temperature: 0.7, // Slightly higher for creative distractors
    });

    // 解析 Claude 返回的 JSON
    const content = result.content.trim();
    // 去除可能的 markdown 代码块标记
    const jsonStr = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const questions = JSON.parse(jsonStr) as any[];

    // 验证题目格式
    if (!Array.isArray(questions) || questions.length === 0) {
      console.warn("Claude returned empty or invalid questions array");
      return null;
    }

    // 标准化题目格式，添加 id 和 difficulty
    const validated: QuizQuestion[] = questions.map((q: any, i: number) => {
      // 验证必填字段
      if (!q.type || !q.prompt || !q.options || !q.correctAnswer) {
        throw new Error(`Question ${i} missing required fields`);
      }
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Question ${i} must have exactly 4 options`);
      }
      // 验证 correctAnswer 在 options 中存在
      const labels = q.options.map((o: any) => o.label);
      if (!labels.includes(q.correctAnswer)) {
        throw new Error(
          `Question ${i} correctAnswer "${q.correctAnswer}" not in options`
        );
      }

      return {
        id: i + 1,
        type: q.type,
        difficulty,
        prompt: q.prompt,
        reference: q.reference || "",
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || q.reference || "",
      };
    });

    console.log(
      `[quiz-generator] Claude generated ${validated.length} questions (${result.usage.inputTokens}+${result.usage.outputTokens} tokens)`
    );
    return validated;
  } catch (err) {
    console.warn("[quiz-generator] Claude generation failed, falling back to local:", err instanceof Error ? err.message : err);
    return null;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * 生成每日测验题目。
 *
 * 流程：
 * 1. 检查数据库缓存 → 有则直接返回
 * 2. 尝试 Claude API 生成 → 成功则缓存并返回
 * 3. Claude 失败 → 回退到本地生成器 → 缓存并返回
 */
export async function generateDailyQuiz(
  options: GenerateOptions = {}
): Promise<QuizSession> {
  const date = options.date || todayString();
  const count = options.count || 5;
  const difficulty = options.difficulty || "medium";

  // 1. 尝试从数据库缓存获取
  try {
    const { getDailyQuizCache } = await import("@xjoy/db");
    const cached = await getDailyQuizCache(date);
    if (cached) {
      const questions = cached.questions as QuizQuestion[];
      // 确保 questions 是数组格式（可能是 JSONB 对象）
      const normalized = Array.isArray(questions) ? questions : [];
      if (normalized.length > 0) {
        console.log(`[quiz-generator] Cache hit for ${date} (${cached.generated_by})`);
        return { questions: normalized, difficulty };
      }
    }
  } catch (err) {
    // 数据库不可用时跳过缓存（开发环境常见）
    console.warn("[quiz-generator] DB cache lookup failed, generating fresh:", err instanceof Error ? err.message : err);
  }

  // 2. 尝试 Claude API 生成
  let questions: QuizQuestion[] | null = null;
  let generatedBy = "local";

  try {
    questions = await generateWithClaude(date, count, difficulty);
    if (questions) {
      generatedBy = "claude";
    }
  } catch {
    // Claude 不可用，继续回退
  }

  // 3. 回退到本地生成器
  if (!questions || questions.length === 0) {
    console.log("[quiz-generator] Using local fallback generator");
    const localSession = generateLocalQuiz(difficulty, count);
    questions = localSession.questions;
    generatedBy = "local";
  }

  // 4. 缓存到数据库
  try {
    const { setDailyQuizCache } = await import("@xjoy/db");
    await setDailyQuizCache(date, questions, generatedBy);
  } catch (err) {
    console.warn("[quiz-generator] Failed to cache questions:", err instanceof Error ? err.message : err);
  }

  return { questions, difficulty };
}
