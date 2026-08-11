/**
 * ReadingProgressTracker — Client component
 *
 * Mount on chapter pages to record reading progress.
 * Fires once when the chapter loads.
 */
"use client";

import { useEffect, useRef } from "react";
import { recordReading } from "@/lib/reading-progress-client";

interface ReadingProgressTrackerProps {
  book: string;
  chapter: number;
}

export function ReadingProgressTracker({ book, chapter }: ReadingProgressTrackerProps) {
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;

    recordReading({ book, chapter }).catch(() => {
      // 静默失败 — 阅读进度非关键功能
    });
  }, [book, chapter]);

  return null; // 无 UI，仅有副作用
}
