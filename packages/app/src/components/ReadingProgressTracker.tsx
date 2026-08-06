/**
 * ReadingProgressTracker — Client component
 *
 * Mount on chapter pages to record reading progress.
 * Fires once when the chapter loads.
 */
"use client";

import { useEffect, useRef } from "react";

interface ReadingProgressTrackerProps {
  book: string;
  chapter: number;
}

export function ReadingProgressTracker({ book, chapter }: ReadingProgressTrackerProps) {
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;

    fetch("/api/reading-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ book, chapter }),
    }).catch(() => {
      // Silent fail — reading progress is non-critical
    });
  }, [book, chapter]);

  return null; // No UI, just side effects
}
