/**
 * Reader landing page.
 *
 * Redirects to the user's last read position (from localStorage) or Genesis 1.
 * Since localStorage is client-only, we render a client component that reads
 * the persisted position and performs the redirect.
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ReaderPage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    let target = "/reader/Genesis/1";

    try {
      const raw = localStorage.getItem("xjoy-reading-position");
      if (raw) {
        const pos = JSON.parse(raw);
        if (pos?.book && typeof pos.chapter === "number") {
          target = `/reader/${encodeURIComponent(pos.book)}/${pos.chapter}`;
        }
      }
    } catch {
      // corrupted storage — use default
    }

    router.replace(target);
  }, [router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-neutral-500 dark:text-neutral-500">
          Unable to load reader. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-500">
        Opening Scripture…
      </p>
    </div>
  );
}
