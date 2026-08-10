"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

interface JigsawStatus {
  year: number;
  week: number;
  weekStart: string;
  theme: {
    theme: string;
    reference: string;
    description: string;
  };
  today: number;
  todayEarned: boolean;
  earnedPieces: number[];
  collectedCount: number;
  totalPieces: number;
  isComplete: boolean;
}

const DAY_SHORT = ["日", "一", "二", "三", "四", "五", "六"];

export default function JigsawPage() {
  const router = useRouter();

  const [status, setStatus] = useState<JigsawStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/study/jigsaw");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "获取拼图状态失败");
      }
      const data: JigsawStatus = await res.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取拼图状态失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // 格式化日期
  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr + "T00:00:00");
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  // 计算周结束日期
  const getWeekEnd = (startStr: string): string => {
    const d = new Date(startStr + "T00:00:00");
    d.setDate(d.getDate() + 6);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  // ── 加载 ──
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-amber-600 border-t-transparent" />
          <p className="mt-3 text-sm text-neutral-500">加载拼图进度...</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <p className="text-neutral-500 mb-4">
          {error || "无法加载拼图数据"}
        </p>
        <button
          onClick={fetchStatus}
          className="text-sm text-amber-600 hover:text-amber-700 underline"
        >
          重试
        </button>
      </div>
    );
  }

  const { theme, earnedPieces, collectedCount, totalPieces, isComplete } = status;
  const completionPercent = Math.round((collectedCount / totalPieces) * 100);

  return (
    <div className="min-h-[70vh] flex flex-col">
      {/* 返回 */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
        >
          ← 返回 Study
        </button>
      </div>

      {/* 标题 */}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-neutral-900 dark:text-neutral-100">
        🧩 Weekly Jigsaw
      </h1>
      <p className="text-neutral-600 dark:text-neutral-400 mb-2">
        每天完成 Quiz（答对 ≥ 3 题）收集拼图碎片，集齐 7 片解锁本周经文主题
      </p>

      {/* 本周主题（未完成时部分隐藏） */}
      <div
        className={`p-5 rounded-lg border mb-6 transition-all ${
          isComplete
            ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700"
            : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-neutral-400">
            {formatDate(status.weekStart)} — {getWeekEnd(status.weekStart)} · 第 {status.week} 周
          </p>
          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
            {collectedCount}/{totalPieces}
          </span>
        </div>

        {isComplete ? (
          <>
            <p className="text-lg font-bold text-amber-900 dark:text-amber-200">
              ✨ {theme.theme}
            </p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
              {theme.description}
            </p>
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-500 font-serif italic">
              — {theme.reference}
            </p>
          </>
        ) : (
          <>
            <p className="text-lg font-bold text-neutral-400 dark:text-neutral-600">
              ??? · 本周主题
            </p>
            <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-600">
              集齐全部 7 片碎片后揭晓
            </p>
          </>
        )}
      </div>

      {/* 拼图网格 */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-neutral-500 mb-3">本周收集进度</h3>

        {/* 进度条 */}
        <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 mb-6">
          <div
            className="bg-amber-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        {/* 7 天拼图网格 */}
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => {
            const earned = earnedPieces.includes(day);
            const isToday = status.today === day;
            const isPast = day < status.today;
            const isFuture = day > status.today;

            return (
              <div key={day} className="flex flex-col items-center gap-1.5">
                {/* 碎片 */}
                <div
                  className={`w-full aspect-square rounded-xl flex items-center justify-center border-2 transition-all ${
                    earned
                      ? "bg-amber-100 dark:bg-amber-900/40 border-amber-400 dark:border-amber-600 shadow-sm"
                      : isToday
                      ? "border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10 animate-pulse"
                      : isFuture
                      ? "border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
                      : "border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800/50 opacity-50"
                  }`}
                >
                  {earned ? (
                    <span className="text-xl sm:text-2xl">🧩</span>
                  ) : isPast && !earned ? (
                    <span className="text-sm text-neutral-300 dark:text-neutral-600">✗</span>
                  ) : isFuture ? (
                    <span className="text-sm text-neutral-300 dark:text-neutral-600">🔒</span>
                  ) : (
                    <span className="text-sm text-amber-400 dark:text-amber-600">?</span>
                  )}
                </div>
                {/* 日期标签 */}
                <span
                  className={`text-xs font-medium ${
                    isToday
                      ? "text-amber-600 dark:text-amber-400"
                      : earned
                      ? "text-green-600 dark:text-green-400"
                      : "text-neutral-400"
                  }`}
                >
                  {isToday ? "今天" : DAY_SHORT[day]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 完成状态 */}
      {isComplete && (
        <div className="p-5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 mb-6 text-center">
          <p className="text-lg font-semibold text-green-700 dark:text-green-400">
            🎉 恭喜！本周拼图已完成！
          </p>
          <p className="mt-1 text-sm text-green-600 dark:text-green-500">
            你对神的话语的殷勤学习配得称赞。下周继续加油！
          </p>
        </div>
      )}

      {/* 未完成时的引导 */}
      {!isComplete && !status.todayEarned && (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-6">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            💡 今天还没有获得碎片哦～去完成每日 Quiz，答对 3 题以上即可收集今日碎片！
          </p>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-3">
        {!status.todayEarned && (
          <button
            onClick={() => router.push("/study/quiz")}
            className="flex-1 rounded-full bg-amber-600 text-white px-6 py-3 text-sm font-medium hover:bg-amber-700 transition-colors text-center"
          >
            去做每日 Quiz
          </button>
        )}
        <button
          onClick={() => router.push("/study")}
          className={`flex-1 rounded-full border px-6 py-3 text-sm font-medium transition-colors text-center ${
            !status.todayEarned
              ? "border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900"
              : "bg-amber-600 text-white hover:bg-amber-700 border-amber-600"
          }`}
        >
          返回 Study
        </button>
      </div>
    </div>
  );
}
