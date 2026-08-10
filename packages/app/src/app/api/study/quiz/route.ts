/**
 * Study Quiz API — 每日经文测验
 *
 * GET  /api/study/quiz — 获取今日测验题目（5 道选择题，同日同题）
 * POST /api/study/quiz — 提交答案 → 计算得分 → 奖励拼图碎片（得分 ≥ 3/5）
 *
 * 题目来源：
 *   1. Claude API 预生成（高质量、多样化）→ 缓存到 PostgreSQL
 *   2. 本地生成器（回退，不依赖外部 API）
 */

import { NextRequest, NextResponse } from "next/server";
import { calculateScore } from "@/lib/quiz-generator";
import { generateDailyQuiz } from "@/lib/quiz-generator-claude";
import type { QuizQuestion, Difficulty } from "@/lib/quiz-generator";

export const runtime = "nodejs";

const VALID_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

/** 获得拼图碎片所需的最低正确数（≥ 3/5） */
const JIGSAW_THRESHOLD = 3;

// ── Helpers ────────────────────────────────────────────────────────────────────

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

function getDayOfWeek(): number {
  return new Date().getDay(); // 0=Sun, 6=Sat
}

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

function getResultMessage(score: number, total: number): string {
  const ratio = score / total;
  if (ratio >= 0.9) return "太棒了！你对经文非常熟悉 🎉";
  if (ratio >= 0.7) return "做得不错！继续深入学习神的话语 ✨";
  if (ratio >= 0.5) return "加油！多读经会越来越好 💪";
  return "别灰心！每一次学习都是成长 📖";
}

// ── GET — 获取今日题目 ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const difficultyParam = request.nextUrl.searchParams.get("difficulty") || "medium";

  if (!VALID_DIFFICULTIES.includes(difficultyParam as Difficulty)) {
    return NextResponse.json(
      { error: `无效的难度等级。可选：${VALID_DIFFICULTIES.join("、")}` },
      { status: 400 }
    );
  }

  const date = todayString();

  try {
    const session = await generateDailyQuiz({
      date,
      count: 5,
      difficulty: difficultyParam as Difficulty,
    });

    // 检查今日是否已经答过题
    let alreadyCompleted = false;
    let previousScore: number | null = null;
    try {
      const { getTodayQuizAttempt } = await import("@xjoy/db");
      const attempt = await getTodayQuizAttempt(date);
      if (attempt) {
        alreadyCompleted = true;
        previousScore = attempt.score;
      }
    } catch {
      // DB 不可用时跳过
    }

    return NextResponse.json({
      ...session,
      date,
      alreadyCompleted,
      previousScore,
    });
  } catch (err) {
    console.error("Daily quiz generation error:", err);
    return NextResponse.json(
      { error: "生成题目失败，请稍后重试。" },
      { status: 500 }
    );
  }
}

// ── POST — 提交答案 ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questions, answers } = body;

    if (!questions || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "请求格式无效。需要 questions 和 answers 字段。" },
        { status: 400 }
      );
    }

    if (answers.length === 0) {
      return NextResponse.json(
        { error: "请至少回答一道题目。" },
        { status: 400 }
      );
    }

    const scoreResult = calculateScore(answers, questions);
    const date = todayString();
    const dayOfWeek = getDayOfWeek();
    const { year, week } = getWeekNumber(new Date());

    // 构建详细的答题记录
    const answerDetails = answers.map((a: { questionId: number; selectedAnswer: string }) => {
      const question = questions.find((q: QuizQuestion) => q.id === a.questionId);
      return {
        questionId: a.questionId,
        selectedAnswer: a.selectedAnswer,
        correctAnswer: question?.correctAnswer || "",
        correct: question?.correctAnswer === a.selectedAnswer,
      };
    });

    // 持久化答题记录
    try {
      const { saveQuizAttempt } = await import("@xjoy/db");
      await saveQuizAttempt(
        date,
        scoreResult.score,
        scoreResult.total,
        scoreResult.correct,
        answerDetails
      );
    } catch (err) {
      console.warn("Failed to save quiz attempt:", err);
    }

    // 检查是否获得拼图碎片（正确数 ≥ 3）
    let jigsawPieceEarned = false;
    if (scoreResult.correct >= JIGSAW_THRESHOLD) {
      try {
        const { awardJigsawPiece } = await import("@xjoy/db");
        await awardJigsawPiece(year, week, dayOfWeek);
        jigsawPieceEarned = true;
      } catch (err) {
        console.warn("Failed to award jigsaw piece:", err);
      }
    }

    // 获取本周拼图进度
    let jigsawProgress: number[] = [];
    try {
      const { getJigsawProgress } = await import("@xjoy/db");
      const pieces = await getJigsawProgress(year, week);
      jigsawProgress = pieces.map((p) => p.piece_day);
    } catch {
      // DB 不可用时跳过
    }

    return NextResponse.json({
      score: scoreResult.score,
      total: scoreResult.total,
      correct: scoreResult.correct,
      details: scoreResult.details,
      message: getResultMessage(scoreResult.score, scoreResult.total),
      jigsawPieceEarned,
      jigsawProgress,
      weekInfo: { year, week },
    });
  } catch (err) {
    console.error("Quiz scoring error:", err);
    return NextResponse.json(
      { error: "评分失败，请稍后重试。" },
      { status: 500 }
    );
  }
}
