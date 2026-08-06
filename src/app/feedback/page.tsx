/**
 * Feedback page.
 *
 * A structured feedback form for the initial user testing phase (XJO-7).
 * Covers: AI chat accuracy, reading experience, overall impression,
 * feature requests, and bug reports.
 */
"use client";

import { useState, type FormEvent } from "react";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_LABELS,
  type FeedbackCategory,
} from "@/lib/feedback-types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  category: FeedbackCategory;
  rating: number;
  comment: string;
  email: string;
}

type SubmitStatus = "idle" | "submitting" | "success" | "error";

// ── Constants ─────────────────────────────────────────────────────────────────

const INITIAL_FORM: FormState = {
  category: "overall_impression",
  rating: 0, // 0 = no rating selected
  comment: "",
  email: "",
};

const CATEGORY_PLACEHOLDERS: Record<FeedbackCategory, string> = {
  ai_accuracy:
    "例如：AI 的回答是否基于经文？有没有出现引用错误或捏造？回答的深度和帮助程度如何？",
  reading_experience:
    "例如：阅读界面是否清晰？字体大小和排版是否舒适？章节之间导航是否方便？深色模式效果如何？",
  overall_impression:
    "例如：应用整体感觉如何？是否愿意继续使用？有什么特别喜欢的或不喜欢的地方？",
  feature_request:
    "例如：你希望添加什么功能？搜索、书签、笔记、分享、经文比较等等？",
  bug: "例如：哪个页面的什么功能出问题了？浏览器是什么？能复现吗？描述越详细越好。",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function FeedbackPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (form.comment.trim().length === 0) {
      setErrorMessage("请填写反馈内容。");
      return;
    }

    setStatus("submitting");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          rating: form.rating > 0 ? form.rating : undefined,
          comment: form.comment,
          email: form.email.trim() || undefined,
          pageUrl: window.location.href,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `提交失败 (${res.status})`);
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "提交失败，请稍后重试。"
      );
    }
  }

  function handleSubmitAnother() {
    setForm(INITIAL_FORM);
    setStatus("idle");
    setErrorMessage("");
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3">感谢你的反馈！</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto">
            你的意见对我们非常重要。我们会认真阅读每一条反馈，并用于改进 Xjoy。
          </p>
          <button
            onClick={handleSubmitAnother}
            className="px-6 py-2.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium hover:opacity-80 transition-opacity"
          >
            提交新的反馈
          </button>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold mb-3">用户反馈</h1>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          帮助我们让 Xjoy 变得更好。你的反馈将直接指导我们下一个版本的开发方向。
          所有字段均可选填，但越详细越好。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Category */}
        <fieldset>
          <legend className="text-sm font-semibold mb-3">
            反馈类别 <span className="text-red-500">*</span>
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FEEDBACK_CATEGORIES.map((cat) => (
              <label
                key={cat}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                  form.category === cat
                    ? "border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-900"
                    : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={cat}
                  checked={form.category === cat}
                  onChange={() => updateField("category", cat)}
                  className="sr-only"
                />
                <span className="text-sm font-medium">
                  {FEEDBACK_CATEGORY_LABELS[cat]}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Rating */}
        <fieldset>
          <legend className="text-sm font-semibold mb-3">
            评分（可选，1-5 星）
          </legend>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => updateField("rating", star)}
                className={`w-10 h-10 rounded-md flex items-center justify-center text-xl transition-colors ${
                  form.rating >= star
                    ? "text-amber-500"
                    : "text-neutral-300 dark:text-neutral-600 hover:text-amber-400"
                }`}
                aria-label={`${star} 星`}
              >
                ★
              </button>
            ))}
            {form.rating > 0 && (
              <button
                type="button"
                onClick={() => updateField("rating", 0)}
                className="ml-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                清除
              </button>
            )}
          </div>
        </fieldset>

        {/* Comment */}
        <div>
          <label className="text-sm font-semibold mb-3 block">
            详细反馈 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.comment}
            onChange={(e) => updateField("comment", e.target.value)}
            placeholder={CATEGORY_PLACEHOLDERS[form.category]}
            rows={6}
            maxLength={5000}
            className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
          />
          <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-1.5">
            {form.comment.length}/5000
          </p>
        </div>

        {/* Email */}
        <div>
          <label className="text-sm font-semibold mb-3 block">
            邮箱（可选，如需我们回复）
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
          />
        </div>

        {/* Error message */}
        {status === "error" && errorMessage && (
          <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
            {errorMessage}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full sm:w-auto px-8 py-3 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-semibold hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "提交中…" : "提交反馈"}
        </button>
      </form>
    </div>
  );
}
