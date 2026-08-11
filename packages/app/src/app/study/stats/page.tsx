"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

/** 学习统计数据（本地类型，避免从 @xjoy/db 导入 pg）。 */
interface StudyStats {
  streak: {
    current_days: number;
    longest_days: number;
    total_active_days: number;
  };
  quiz: {
    total_games: number;
    total_questions: number;
    accuracy: number;
    high_score: number;
  };
  jigsaw: {
    total_games: number;
    best_score: number;
    avg_accuracy: number;
    best_time: number;
  };
  chapters_completed: number;
}

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/study/stats");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "获取统计数据失败");
      }
      const data: StudyStats = await res.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取统计数据失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-amber-600 border-t-transparent" />
          <p className="mt-3 text-sm text-neutral-500">正在加载学习统计...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error && !stats) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchStats}
          className="text-sm text-amber-600 hover:text-amber-700 underline"
        >
          重试
        </button>
      </div>
    );
  }

  // ── Empty state ──
  if (!stats || (stats.quiz.total_games === 0 && stats.jigsaw.total_games === 0)) {
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

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <span className="text-5xl mb-4">📊</span>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            学习统计
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm">
            还没有任何学习记录。完成一次 Bible Quiz 或 Weekly Jigsaw，这里就会显示你的学习数据。
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/study/quiz")}
              className="rounded-full bg-amber-600 text-white px-6 py-2.5 text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              开始 Quiz
            </button>
            <button
              onClick={() => router.push("/study/jigsaw")}
              className="rounded-full border border-neutral-300 dark:border-neutral-700 px-6 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
            >
              开始 Jigsaw
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Stats content ──
  return (
    <div className="min-h-[70vh] pb-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
        >
          ← 返回 Study
        </button>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 text-neutral-900 dark:text-neutral-100">
        📊 学习统计
      </h1>
      <p className="text-neutral-500 dark:text-neutral-400 mb-8">
        你的学习进度与成就一览
      </p>

      {/* Streak Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard
          icon="🔥"
          label="当前连续"
          value={`${stats.streak.current_days} 天`}
          color="amber"
        />
        <StatCard
          icon="🏆"
          label="最长连续"
          value={`${stats.streak.longest_days} 天`}
          color="amber"
        />
        <StatCard
          icon="📅"
          label="活跃天数"
          value={`${stats.streak.total_active_days} 天`}
          color="neutral"
        />
      </div>

      {/* Quiz Stats */}
      <div className="mb-6 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          📝 Bible Quiz
        </h2>
        {stats.quiz.total_games === 0 ? (
          <p className="text-sm text-neutral-400">暂无 Quiz 记录</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MiniStat label="完成次数" value={`${stats.quiz.total_games}`} />
            <MiniStat label="答题总数" value={`${stats.quiz.total_questions}`} />
            <MiniStat label="正确率" value={`${stats.quiz.accuracy}%`} highlight />
            <MiniStat label="最高分" value={`${stats.quiz.high_score}`} />
          </div>
        )}
      </div>

      {/* Jigsaw Stats */}
      <div className="mb-6 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          🧩 Weekly Jigsaw
        </h2>
        {stats.jigsaw.total_games === 0 ? (
          <p className="text-sm text-neutral-400">暂无 Jigsaw 记录</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MiniStat label="完成次数" value={`${stats.jigsaw.total_games}`} />
            <MiniStat label="最高分" value={`${stats.jigsaw.best_score}`} />
            <MiniStat label="平均准确度" value={`${stats.jigsaw.avg_accuracy}%`} highlight />
            <MiniStat label="最快用时" value={formatSeconds(stats.jigsaw.best_time)} />
          </div>
        )}
      </div>

      {/* Chapters Completed */}
      <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          📖 覆盖章节
        </h2>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">
            {stats.chapters_completed}
          </span>
          <span className="text-sm text-neutral-500">个不同章节已完成学习</span>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: "amber" | "neutral";
}) {
  return (
    <div
      className={`p-4 rounded-xl border text-center ${
        color === "amber"
          ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
          : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950"
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-1">
        {value}
      </p>
      <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <p
        className={`text-xl font-bold ${
          highlight
            ? "text-amber-600 dark:text-amber-400"
            : "text-neutral-800 dark:text-neutral-200"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
    </div>
  );
}

function formatSeconds(seconds: number): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
