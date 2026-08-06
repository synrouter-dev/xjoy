/**
 * 设置页 — Settings
 *
 * Reading statistics, theme toggle, font size, and about section.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/components/ThemeProvider";
import type { ReadingStats } from "@/lib/reading-progress";

// ── Components ───────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
      <span className="text-2xl font-bold text-amber-600 dark:text-amber-500">
        {value}
      </span>
      <span className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
        {label}
      </span>
    </div>
  );
}

function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-500 mb-1">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { resolved, toggle } = useTheme();
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reading-progress?stats=true")
      .then((res) => res.json())
      .then((data) => setStats(data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const chaptersRead = stats?.totalChaptersRead ?? 0;
  const booksRead = stats?.totalBooksRead ?? 0;
  const totalChapters = 1189; // KJV total chapters
  const totalBooks = 66;

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          设置
        </h1>
      </div>

      {/* ── Reading Statistics ── */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide mb-4">
          阅读统计
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
          </div>
        ) : stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="已读章节" value={chaptersRead} />
              <StatCard label="已读书卷" value={booksRead} />
              <StatCard label="总经文数" value="31,102" />
            </div>
            <div className="space-y-3 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <ProgressBar value={chaptersRead} max={totalChapters} label={`章节进度 · ${totalChapters} 章`} />
              <ProgressBar value={booksRead} max={totalBooks} label={`书卷进度 · ${totalBooks} 卷`} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-500 dark:text-neutral-500 py-4">
            开始阅读经文后，这里会显示你的阅读进度。
          </p>
        )}
      </section>

      {/* ── Appearance ── */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide mb-4">
          外观
        </h2>
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {/* Theme */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                深色模式
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                切换深色/浅色主题
              </p>
            </div>
            <button
              onClick={toggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                resolved === "dark" ? "bg-amber-600" : "bg-neutral-300 dark:bg-neutral-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  resolved === "dark" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Current Theme */}
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                当前主题
              </p>
            </div>
            <span className="text-sm text-neutral-500 dark:text-neutral-500">
              {resolved === "dark" ? "深色" : "浅色"}
            </span>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide mb-4">
          关于
        </h2>
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="px-4 py-4">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Xjoy — AI 智慧圣经
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              版本 0.1.0 · 基于 KJV (King James Version)
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-3 leading-relaxed">
              Xjoy 是一个 AI 驱动的 KJV 圣经应用。AI 回答基于经文原文，
              旨在辅助理解，而非替代牧者或学者的权威。愿神的话语照亮你的道路。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
