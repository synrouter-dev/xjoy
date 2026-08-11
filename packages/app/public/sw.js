/**
 * Xjoy Service Worker
 *
 * Provides offline caching for core app assets and scripture data.
 * Uses a cache-first strategy for static assets and network-first for API calls.
 *
 * GitHub Pages 兼容：从 self.location 自动检测 basePath（如 /xjoy）。
 */

const CACHE_NAME = "xjoy-v2";

// ── 自动检测 basePath ─────────────────────────────────────────────────────────

/**
 * 从 SW 自身的 URL 推断应用的 basePath。
 * 例如 sw.js 位于 /xjoy/sw.js → basePath = /xjoy
 * sw.js 位于 /sw.js → basePath = ""
 */
function getBasePath() {
  const swPath = self.location.pathname; // e.g. /xjoy/sw.js 或 /sw.js
  const match = swPath.match(/^(.+)\/sw\.js$/);
  return match ? match[1] : "";
}

const BASE = getBasePath();

/** 生成带 basePath 的完整路径。 */
function appPath(path) {
  if (BASE) {
    return `${BASE}${path}`;
  }
  return path;
}

// ── Pre-cache 路由列表 ───────────────────────────────────────────────────────

const STATIC_ASSETS = [
  appPath("/"),
  appPath("/reader"),
  appPath("/catalog"),
  appPath("/search"),
  appPath("/chat"),
  appPath("/notes"),
  appPath("/settings"),
  appPath("/manifest.json"),
];

// ── Install: Pre-cache static assets ─────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        // 单个资源加载失败不阻塞整个 SW 安装
        console.warn("[xjoy-sw] Pre-cache partial failure:", err.message);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: Clean old caches ───────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ── Fetch: Cache-first for static, network-first for API ─────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // API requests: network-first
  if (url.pathname.startsWith(appPath("/api/"))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Navigation requests: network-first（确保获取最新页面）
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets and pages: cache-first
  event.respondWith(cacheFirst(request));
});

// ── Strategies ───────────────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline fallback
    return new Response("离线模式 — 请连接网络后重试", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "网络不可用" }), {
      status: 503,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
}
