/**
 * ServiceWorkerRegistration — Client component
 *
 * Registers the service worker for PWA offline support.
 * 使用 build-time NEXT_PUBLIC_BASE_PATH 兼容 GitHub Pages 子路径。
 */
"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // 构建时注入的 basePath（如 /xjoy），自定义域名时为空
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const swUrl = `${basePath}/sw.js`;

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log("SW registered:", registration.scope);
      })
      .catch((err) => {
        console.error("SW registration failed:", err);
      });
  }, []);

  return null;
}
