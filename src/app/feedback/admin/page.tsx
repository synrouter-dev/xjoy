/**
 * Feedback admin page.
 *
 * Simple dashboard for viewing and triaging user feedback during
 * the initial testing phase (XJO-7). Accessible to anyone during
 * MVP testing — add auth before public launch.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_LABELS,
  type FeedbackCategory,
  type FeedbackRecord,
} from "@/lib/feedback-types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FeedbackSummary {
  category: FeedbackCategory;
  count: number;
  avgRating: number | null;
}

interface FeedbackListResponse {
  feedback: FeedbackRecord[];
  total: number;
}

type LoadingState = "idle" | "loading" | "error";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderStars(rating: number | null | undefined): string {
  if (rating == null) return "—";
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

const CATEGORY_COLORS: Record<FeedbackCategory, string> = {
  ai_accuracy: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
  reading_experience:
    "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
  overall_impression:
    "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
  feature_request:
    "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300",
  bug: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function FeedbackAdminPage() {
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [summary, setSummary] = useState<FeedbackSummary[]>([]);
  const [state, setState] = useState<LoadingState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // ── Fetch feedback ────────────────────────────────────────────────────────

  const fetchFeedback = useCallback(async (category?: string) => {
    setState("loading");
    setErrorMsg("");

    try {
      const params = new URLSearchParams();
      if (category && category !== "all") {
        params.set("category", category);
      }

      const res = await fetch(`/api/feedback?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `请求失败 (${res.status})`);
      }

      const data: FeedbackListResponse = await res.json();
      setFeedback(data.feedback);
      setState("idle");
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "加载失败");
    }
  }, []);

  // ── Fetch summary ─────────────────────────────────────────────────────────

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/feedback?summary=true");
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
      }
    } catch {
      // Summary is supplementary — silent fail
    }
  }, []);

  // ── Load on mount ─────────────────────────────────────────────────────────

  useEffect(() => {
    fetchFeedback();
    fetchSummary();
  }, [fetchFeedback, fetchSummary]);

  // ── Filter handler ────────────────────────────────────────────────────────

  function handleFilterChange(category: string) {
    setFilterCategory(category);
    fetchFeedback(category);
  }

  // ── Stats tile ────────────────────────────────────────────────────────────

  const totalFeedback = feedback.length;
  const totalWithRating = feedback.filter((f) => f.rating != null);
  const avgRating =
    totalWithRating.length > 0
      ? (
          totalWithRating.reduce((sum, f) => sum + (f.rating ?? 0), 0) /
          totalWithRating.length
        ).toFixed(1)
      : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">反馈管理</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          查看和管理用户测试反馈（XJO-7 初始用户测试阶段）。
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatTile label="反馈总数" value={String(totalFeedback)} />
        <StatTile
          label="平均评分"
          value={avgRating ? `${avgRating} / 5` : "—"}
        />
        <StatTile
          label="有评分"
          value={String(totalWithRating.length)}
        />
        <StatTile
          label="Bug 报告"
          value={String(feedback.filter((f) => f.category === "bug").length)}
          highlight="bug"
        />
      </div>

      {/* Per-category summary */}
      {summary.length > 0 && (
        <div className="mb-8 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-sm font-semibold mb-3">分类统计</h2>
          <div className="space-y-2">
            {summary.map((s) => (
              <div
                key={s.category}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      CATEGORY_COLORS[s.category]
                    }`}
                  >
                    {FEEDBACK_CATEGORY_LABELS[s.category]}
                  </span>
                </span>
                <span className="text-neutral-500 dark:text-neutral-400">
                  {s.count} 条
                  {s.avgRating != null && ` · 均分 ${s.avgRating}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mr-1">
          筛选：
        </span>
        <FilterButton
          active={filterCategory === "all"}
          onClick={() => handleFilterChange("all")}
        >
          全部
        </FilterButton>
        {FEEDBACK_CATEGORIES.map((cat) => (
          <FilterButton
            key={cat}
            active={filterCategory === cat}
            onClick={() => handleFilterChange(cat)}
          >
            {FEEDBACK_CATEGORY_LABELS[cat]}
          </FilterButton>
        ))}
      </div>

      {/* Feedback list */}
      {state === "loading" && (
        <div className="text-center py-16 text-neutral-500">
          加载中…
        </div>
      )}

      {state === "error" && (
        <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400 mb-6">
          {errorMsg}
        </div>
      )}

      {state === "idle" && feedback.length === 0 && (
        <div className="text-center py-16 text-neutral-400 dark:text-neutral-600">
          <p className="text-lg mb-2">暂无反馈</p>
          <p className="text-sm">用户提交的反馈将显示在这里。</p>
        </div>
      )}

      {state === "idle" && feedback.length > 0 && (
        <div className="space-y-4">
          {feedback.map((item) => (
            <FeedbackCard key={item.id} feedback={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: string;
}) {
  return (
    <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
      <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
        {label}
      </div>
      <div
        className={`text-2xl font-bold ${
          highlight === "bug" && value !== "0"
            ? "text-red-600 dark:text-red-400"
            : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        active
          ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
      }`}
    >
      {children}
    </button>
  );
}

function FeedbackCard({ feedback }: { feedback: FeedbackRecord }) {
  return (
    <div className="p-5 rounded-lg border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-start justify-between gap-4 mb-3">
        {/* Category badge + rating */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              CATEGORY_COLORS[feedback.category]
            }`}
          >
            {FEEDBACK_CATEGORY_LABELS[feedback.category]}
          </span>
          <span className="text-sm text-amber-500" title={`${feedback.rating ?? "—"} / 5`}>
            {renderStars(feedback.rating)}
          </span>
        </div>

        {/* Meta */}
        <div className="text-xs text-neutral-400 dark:text-neutral-600 shrink-0 text-right">
          <div>{formatDate(feedback.createdAt)}</div>
          {feedback.email && (
            <div className="truncate max-w-[200px]">{feedback.email}</div>
          )}
        </div>
      </div>

      {/* Comment */}
      <p className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
        {feedback.comment}
      </p>
    </div>
  );
}
