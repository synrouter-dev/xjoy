"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { QuizSession, QuizQuestion, Difficulty } from "@/lib/quiz-generator";

type QuizState = "loading" | "ready" | "playing" | "finished";

interface AnswerRecord {
  questionId: number;
  selectedAnswer: string;
}

interface QuizResult {
  score: number;
  total: number;
  correct: number;
  message: string;
  details: { questionId: number; correct: boolean }[];
  jigsawPieceEarned: boolean;
  jigsawProgress: number[];
  weekInfo: { year: number; week: number };
}

export default function QuizPage() {
  const router = useRouter();

  const [state, setState] = useState<QuizState>("loading");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [session, setSession] = useState<QuizSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quizDate, setQuizDate] = useState<string>("");
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [scoreResult, setScoreResult] = useState<QuizResult | null>(null);

  // 获取今日题目
  const fetchQuiz = useCallback(async (diff: Difficulty) => {
    setState("loading");
    setError(null);
    try {
      const res = await fetch(`/api/study/quiz?difficulty=${diff}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "获取题目失败");
      }
      const data = await res.json();
      setSession({ questions: data.questions, difficulty: data.difficulty });
      setQuizDate(data.date || "");
      setAlreadyCompleted(data.alreadyCompleted || false);
      setPreviousScore(data.previousScore ?? null);
      setCurrentIndex(0);
      setAnswers([]);
      setSelectedOption(null);
      setScoreResult(null);
      setState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取题目失败");
      setState("ready");
    }
  }, []);

  // 开始答题
  const startQuiz = () => {
    setState("playing");
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedOption(null);
    setScoreResult(null);
  };

  // 选择选项
  const selectOption = (label: string) => {
    setSelectedOption(label);
  };

  // 确认答案并进入下一题
  const confirmAnswer = () => {
    if (!selectedOption || !session) return;

    const question = session.questions[currentIndex];
    const newAnswer: AnswerRecord = {
      questionId: question.id,
      selectedAnswer: selectedOption,
    };

    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);
    setSelectedOption(null);

    if (currentIndex + 1 < session.questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 最后一题，提交评分
      submitAnswers(newAnswers);
    }
  };

  // 提交答案评分
  const submitAnswers = async (finalAnswers: AnswerRecord[]) => {
    if (!session) return;
    setState("loading");
    try {
      const res = await fetch("/api/study/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: session.questions,
          answers: finalAnswers,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "评分失败");
      }
      const data: QuizResult = await res.json();
      setScoreResult(data);
      setState("finished");

      // 同时保存到计分系统（study_scores / study_streaks）
      try {
        const accuracy = data.total > 0 ? Math.round((data.correct / (data.total / 10)) * 100) : 0;
        await fetch("/api/study/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            game_type: "quiz",
            score: data.score,
            total: data.total,
            accuracy,
            difficulty: difficulty,
            details: data.details,
          }),
        });
      } catch {
        // 静默失败，不影响主流程
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "评分失败");
      setState("finished");
    }
  };

  // 难度标签
  const difficultyLabel = (d: Difficulty): string => {
    switch (d) {
      case "easy": return "简单";
      case "medium": return "中等";
      case "hard": return "困难";
    }
  };

  const difficultyDesc = (d: Difficulty): string => {
    switch (d) {
      case "easy": return "热门书卷，常见经节";
      case "medium": return "全经范围，加深理解";
      case "hard": return "随机经文，全面挑战";
    }
  };

  const currentQuestion: QuizQuestion | null =
    session && currentIndex < session.questions.length
      ? session.questions[currentIndex]
      : null;

  const typeLabel = (type: string): string => {
    switch (type) {
      case "book_origin": return "经文归属";
      case "fill_blank": return "填空补全";
      case "next_verse": return "上下文接龙";
      case "chapter_context": return "章节定位";
      default: return type;
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  // 星期标签
  const dayOfWeekLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  // ── 加载状态 ──
  if (state === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-amber-600 border-t-transparent" />
          <p className="mt-3 text-sm text-neutral-500">正在生成今日题目...</p>
        </div>
      </div>
    );
  }

  // ── 难度选择 / 开始页 ──
  if (state === "ready" && !session) {
    return (
      <div className="min-h-[70vh] flex flex-col">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          >
            ← 返回 Study
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-neutral-900 dark:text-neutral-100">
          📝 每日 Quiz
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-2">
          每天 5 道经文选择题，答对 3 题以上即可收集今日拼图碎片 🧩
        </p>
        <p className="text-xs text-neutral-400 mb-8">
          同一日内题目相同，可重复挑战但仅首次答题计入拼图收集
        </p>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => {
                setDifficulty(d);
                fetchQuiz(d);
              }}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                difficulty === d
                  ? "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20"
                  : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {difficultyLabel(d)}
                </span>
                <span className="text-xs text-neutral-400">{difficultyDesc(d)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── 准备开始（已加载题目） ──
  if (state === "ready" && session) {
    return (
      <div className="min-h-[70vh] flex flex-col">
        <div className="mb-6">
          <button
            onClick={() => {
              setSession(null);
              setScoreResult(null);
            }}
            className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          >
            ← 重新选择难度
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">
          📝 每日 Quiz
        </h1>

        {/* 日期信息 */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-neutral-500">
            {formatDate(quizDate)} {dayOfWeekLabels[new Date(quizDate + "T00:00:00").getDay()]}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            {difficultyLabel(difficulty)}
          </span>
        </div>

        {/* 已完成提示 */}
        {alreadyCompleted && previousScore !== null && (
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mb-6">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              📋 今日已完成答题（得分：{previousScore}/50）。你可以重新挑战，但仅首次答题计入拼图收集。
            </p>
          </div>
        )}

        <p className="text-neutral-600 dark:text-neutral-400 mb-2">
          共 {session.questions.length} 题 · 每题 10 分 · 满分 {session.questions.length * 10} 分
        </p>
        <p className="text-sm text-amber-600 dark:text-amber-400 mb-8">
          🧩 答对 ≥ 3 题即可收集今日拼图碎片
        </p>

        <div className="p-5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-6">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            📋 题型包括：{["经文归属", "填空补全", "上下文接龙", "章节定位"].join("、")}
          </p>
        </div>

        <button
          onClick={startQuiz}
          className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-amber-600 text-white px-8 py-3 text-base font-medium hover:bg-amber-700 transition-colors"
        >
          开始答题
        </button>
      </div>
    );
  }

  // ── 答题中 ──
  if (state === "playing" && currentQuestion) {
    return (
      <div className="min-h-[70vh] flex flex-col">
        {/* 进度条 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">
              第 {currentIndex + 1} / {session!.questions.length} 题
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              {typeLabel(currentQuestion.type)}
            </span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5">
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / session!.questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* 题干 */}
        <div className="mb-6 p-5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <p className="text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-line">
            {currentQuestion.prompt}
          </p>
        </div>

        {/* 选项 */}
        <div className="space-y-2.5 flex-1">
          {currentQuestion.options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => selectOption(opt.label)}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                selectedOption === opt.label
                  ? "border-amber-500 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/30 ring-1 ring-amber-500"
                  : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700"
              }`}
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-400 mr-2">
                {opt.label}
              </span>
              <span className="text-neutral-800 dark:text-neutral-200">
                {opt.text}
              </span>
            </button>
          ))}
        </div>

        {/* 确认按钮 */}
        <div className="mt-6">
          <button
            onClick={confirmAnswer}
            disabled={!selectedOption}
            className={`w-full rounded-full px-8 py-3 text-base font-medium transition-colors ${
              selectedOption
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
            }`}
          >
            {currentIndex + 1 < session!.questions.length ? "下一题" : "提交答案"}
          </button>
        </div>
      </div>
    );
  }

  // ── 完成 / 结果页 ──
  if (state === "finished" && scoreResult) {
    const ratio = scoreResult.score / scoreResult.total;
    // 拼图碎片收集状态
    const jigsawDays = scoreResult.jigsawProgress || [];
    const jigsawCollected = jigsawDays.length;
    const jigsawTotal = 7;
    const jigsawEarned = scoreResult.jigsawPieceEarned;

    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center">
        {/* 拼图碎片奖励动画 */}
        {jigsawEarned && (
          <div className="mb-6 animate-bounce">
            <span className="text-5xl">🧩</span>
            <p className="mt-2 text-lg font-semibold text-amber-600 dark:text-amber-400">
              获得今日拼图碎片！
            </p>
          </div>
        )}

        {/* 分数 */}
        <div className="mb-6">
          <div className="text-6xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {scoreResult.score}
            <span className="text-2xl text-neutral-400">/{scoreResult.total}</span>
          </div>
          <p
            className={`mt-2 text-lg font-medium ${
              ratio >= 0.7
                ? "text-amber-600 dark:text-amber-400"
                : "text-neutral-500"
            }`}
          >
            {scoreResult.message}
          </p>
        </div>

        {/* 统计 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {scoreResult.correct}
            </div>
            <div className="text-xs text-neutral-500">正确</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">
              {scoreResult.total / 10 - scoreResult.correct}
            </div>
            <div className="text-xs text-neutral-500">错误</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">
              {Math.round(ratio * 100)}%
            </div>
            <div className="text-xs text-neutral-500">正确率</div>
          </div>
        </div>

        {/* 本周拼图进度 */}
        <div className="w-full max-w-xs mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">
              本周拼图碎片
            </span>
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
              {jigsawCollected}/{jigsawTotal}
            </span>
          </div>
          <div className="flex gap-1.5 justify-center">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => {
              const earned = jigsawDays.includes(day);
              const isToday = new Date().getDay() === day;
              return (
                <div
                  key={day}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm border-2 transition-all ${
                    earned
                      ? "bg-amber-100 dark:bg-amber-900/40 border-amber-400 dark:border-amber-600"
                      : isToday
                      ? "border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10"
                      : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
                  }`}
                >
                  {earned ? "🧩" : day === 0 ? "日" : day === 1 ? "一" : day === 2 ? "二" : day === 3 ? "三" : day === 4 ? "四" : day === 5 ? "五" : "六"}
                </div>
              );
            })}
          </div>
          {jigsawCollected >= jigsawTotal && (
            <p className="mt-3 text-sm font-medium text-amber-600 dark:text-amber-400">
              🎉 本周拼图已完成！太棒了！
            </p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <button
            onClick={() => fetchQuiz(difficulty)}
            className="flex-1 rounded-full bg-amber-600 text-white px-6 py-3 text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            再来一轮
          </button>
          <button
            onClick={() => {
              setSession(null);
              setScoreResult(null);
              setState("ready");
            }}
            className="flex-1 rounded-full border border-neutral-300 dark:border-neutral-700 px-6 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            换难度
          </button>
          <button
            onClick={() => router.push("/study/jigsaw")}
            className="flex-1 rounded-full border border-amber-300 dark:border-amber-700 px-6 py-3 text-sm font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
          >
            查看拼图
          </button>
        </div>
      </div>
    );
  }

  // fallback
  return null;
}
