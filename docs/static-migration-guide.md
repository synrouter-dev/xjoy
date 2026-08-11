# Xjoy 静态迁移指南 — GitHub Pages 部署

> **目的**：将 Xjoy Next.js 应用从 Vercel（`*.vercel.app` 被 GFW 封锁）迁移到 GitHub Pages（`*.github.io` 中国可达）。
> **关联 Issue**：XJO-312（创始工程师实施）
> **总估时**：12-18h
> **策略**：静态导出核心读经功能；AI 聊天后续通过 API 代理补齐。

---

## 背景

- **当前部署**：`xjoy-gray.vercel.app`（Vercel + Neon + Anthropic API）
- **问题**：`*.vercel.app` 全域 IP 被 GFW 封锁，中国测试用户无法访问
- **确认**：`*.github.io` 域名在中国大陆可正常访问
- **目标**：核心读经功能（浏览、搜索、书签/笔记）在 GitHub Pages 上可用

---

## 架构变更概览

```
变更前（Vercel）：                    变更后（GitHub Pages）：
┌──────────────────────┐              ┌──────────────────────┐
│  Next.js SSR + API   │              │  Next.js static      │
│  Routes (Node.js)    │              │  export (HTML/JS)    │
│     ↓          ↓     │              │         ↓            │
│  Neon DB   Anthropic │              │  Client-side JSON    │
│  (pg+vec)  (Claude)  │              │  (5.7MB KJV data)    │
└──────────────────────┘              │         ↓            │
                                      │  localStorage        │
                                      │  (notes/bookmarks)   │
                                      └──────────────────────┘
```

### 功能覆盖

| 功能 | 静态部署 | 说明 |
|------|:---:|------|
| 经文浏览（按书卷/章节） | ✅ | `generateStaticParams` 预生成 1,255 页 |
| 经文搜索 | ✅ | 客户端内存索引（5.7MB JSON） |
| 书签 / 笔记 | ✅ | localStorage 替代 Neon DB |
| 阅读进度追踪 | ✅ | localStorage 持久化 |
| AI 聊天 | ❌ | 暂时禁用，显示"即将上线"占位 |
| 学习计划生成 | ❌ | 需要 Claude API，后续补齐 |
| 交叉引用 | ⚠️ | 可选：预计算嵌入客户端或省略 |

---

## 实施步骤（共 7 步，12-18h）

### Step 1: 创建客户端圣经数据模块 (3-4h)

**文件**：`packages/app/src/lib/bible-data.ts`（新建）

**目的**：将 `packages/app/data/kjv.json`（5.7MB）加载为浏览器端可用的内存数据结构，替代当前服务端 `@xjoy/shared` 的 `getChapter`、`getBooks` 等函数。

**实现要点**：

```typescript
// packages/app/src/lib/bible-data.ts

import type { Verse } from "@xjoy/shared";

interface KjvData {
  meta: {
    source: string;
    fetchedAt: string;
    totalBooks: number;
    totalChapters: number;
    totalVerses: number;
  };
  verses: Verse[];
}

interface BibleIndex {
  /** book -> chapter -> verse number -> Verse */
  byRef: Map<string, Map<number, Map<number, Verse>>>;
  /** book -> ordered list of chapters */
  books: Map<string, number[]>;
  /** verse list (ordered, for search) */
  verseList: Verse[];
}

let _dataPromise: Promise<BibleIndex> | null = null;

/**
 * 延迟加载 KJV 数据并构建索引。
 * 首次调用触发 fetch（~5.7MB），后续返回缓存。
 * 预计加载时间：200-500ms（取决于网络）。
 */
export async function loadBibleData(): Promise<BibleIndex> {
  if (_dataPromise) return _dataPromise;

  _dataPromise = (async () => {
    const res = await fetch("/data/kjv.json");
    if (!res.ok) throw new Error(`加载经文数据失败: ${res.status}`);
    const data: KjvData = await res.json();

    const byRef = new Map<string, Map<number, Map<number, Verse>>>();
    const books = new Map<string, number[]>();

    for (const v of data.verses) {
      if (!byRef.has(v.book)) {
        byRef.set(v.book, new Map());
        books.set(v.book, []);
      }
      const chapters = byRef.get(v.book)!;
      if (!chapters.has(v.chapter)) {
        chapters.set(v.chapter, new Map());
        books.get(v.book)!.push(v.chapter);
      }
      chapters.get(v.chapter)!.set(v.verse, v);
    }

    // 去重并排序每卷书的章节列表
    for (const [book, chaps] of books) {
      books.set(book, [...new Set(chaps)].sort((a, b) => a - b));
    }

    console.log(
      `[bible-data] 索引就绪: ${data.meta.totalVerses} 节经文, ${books.size} 卷书`
    );

    return { byRef, books, verseList: data.verses };
  })();

  return _dataPromise;
}

/**
 * 获取指定章节的所有经文。
 */
export async function getChapter(
  book: string,
  chapter: number
): Promise<Verse[]> {
  const idx = await loadBibleData();
  const chapters = idx.byRef.get(book);
  if (!chapters) return [];
  const verses = chapters.get(chapter);
  if (!verses) return [];
  return Array.from(verses.values()).sort((a, b) => a.verse - b.verse);
}

/**
 * 获取所有书卷列表。
 */
export async function getBooks(): Promise<string[]> {
  const idx = await loadBibleData();
  return Array.from(idx.books.keys());
}

/**
 * 获取某卷书的章节数。
 */
export async function getChapterCount(book: string): Promise<number> {
  const idx = await loadBibleData();
  return idx.books.get(book)?.length ?? 0;
}

/**
 * 获取上一章 / 下一章引用。
 */
export async function getAdjacentChapters(
  book: string,
  chapter: number
): Promise<{ prev: { book: string; chapter: number } | null; next: { book: string; chapter: number } | null }> {
  const idx = await loadBibleData();
  const bookList = Array.from(idx.books.keys());
  const bookIdx = bookList.indexOf(book);

  const prevChapter = chapter - 1;
  const nextChapter = chapter + 1;

  let prev: { book: string; chapter: number } | null = null;
  let next: { book: string; chapter: number } | null = null;

  if (prevChapter >= 1) {
    prev = { book, chapter: prevChapter };
  } else if (bookIdx > 0) {
    const prevBook = bookList[bookIdx - 1];
    const prevBookChapters = idx.books.get(prevBook) ?? [];
    prev = { book: prevBook, chapter: prevBookChapters[prevBookChapters.length - 1] ?? 1 };
  }

  const maxChapter = idx.books.get(book)?.length ?? 0;
  if (nextChapter <= maxChapter) {
    next = { book, chapter: nextChapter };
  } else if (bookIdx < bookList.length - 1) {
    const nextBook = bookList[bookIdx + 1];
    next = { book: nextBook, chapter: 1 };
  }

  return { prev, next };
}

/**
 * 验证书卷 + 章节引用是否有效。
 */
export async function isValidReference(
  book: string,
  chapter: number
): Promise<boolean> {
  const idx = await loadBibleData();
  const chapters = idx.byRef.get(book);
  if (!chapters) return false;
  return chapters.has(chapter);
}
```

**注意**：
- `kjv.json` 需要放在 `packages/app/public/data/kjv.json`（Next.js 静态资源目录），构建时复制。
- 当前文件位于 `packages/app/data/kjv.json`（不在 public 下）。

**操作**：
```bash
# 确保 kjv.json 在构建时可访问
mkdir -p packages/app/public/data
cp packages/app/data/kjv.json packages/app/public/data/kjv.json
```

在 `package.json` build 脚本中添加此步骤，或使用 `public/data/.gitkeep` + `prebuild` 脚本。

---

### Step 2: 修改 API 适配层 (2-3h)

**文件**：`packages/app/src/lib/api.ts`（新建或扩展现有）

**目的**：当前代码通过 `fetch(/api/verses)` 和 `fetch(/api/chat)` 调用服务端 API。静态部署下这些 API 路由不可用，需要添加客户端回退逻辑。

**实现**：

```typescript
// packages/app/src/lib/api.ts

import { loadBibleData } from "./bible-data";
import type { Verse, VerseSearchResult } from "@xjoy/shared";

// ── 环境检测 ──────────────────────────────────────────────────

/** 静态部署环境（GitHub Pages）下，API 路由不可用 */
export const IS_STATIC = typeof window !== "undefined" &&
  window.location.hostname.endsWith("github.io");

// ── 经文搜索 ──────────────────────────────────────────────────

// 复用 local-search 的搜索算法，但改为客户端版本
// 将 packages/db/src/local-search.ts 中的 searchByTokens 逻辑移植到客户端

// ... (从 local-search.ts 移植 tokenize、searchByTokens、STOP_WORDS 等)

export async function searchVerses(
  query: string,
  limit = 20
): Promise<VerseSearchResult[]> {
  // 静态模式：客户端搜索
  const idx = await loadBibleData();
  // 使用与 local-search.ts 相同的 tokenize + TF-IDF 逻辑
  return clientSearch(query, limit);
}

// ── 经文获取 ──────────────────────────────────────────────────

export async function fetchVerses(
  book: string,
  chapter: number
): Promise<Verse[]> {
  const { getChapter } = await import("./bible-data");
  return getChapter(book, chapter);
}

// ── AI 聊天（占位）──────────────────────────────────────────

export async function chatWithAI(
  _query: string,
  _conversationId?: string
): Promise<{ answer: string; error?: string }> {
  if (IS_STATIC) {
    return {
      answer: "",
      error: "AI 聊天功能在静态部署中暂不可用。请稍后再试。",
    };
  }
  // 原有逻辑（Vercel 部署保留）
  throw new Error("Not implemented for static mode");
}
```

**修改范围**：
- `packages/app/src/app/search/page.tsx`：将 `fetch(/api/verses)` 改为 `searchVerses(query)`
- `packages/app/src/app/reader/[book]/[chapter]/page.tsx`：将服务端 `getChapter` 改为客户端导入
- `packages/app/src/app/chat/`：显示"即将上线"占位（静态模式下）
- 其他 API 调用方：`notes/`, `bookmarks/` 等改用 localStorage

---

### Step 3: 配置 Next.js 静态导出 (1h)

**文件**：`packages/app/next.config.ts`

**修改**：添加 `output: "export"` 配置。

```typescript
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // ── 静态导出 ────────────────────────────────────────────────
  output: "export",
  // 静态导出时禁用图片优化（GitHub Pages 不支持）
  images: { unoptimized: true },
  // 设置 basePath（如果部署到 user.github.io/repo/）
  // basePath: process.env.GITHUB_ACTIONS ? "/xjoy" : "",
  // assetPrefix: process.env.GITHUB_ACTIONS ? "/xjoy/" : "",
  // ── 原有配置 ────────────────────────────────────────────────
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  transpilePackages: ["@xjoy/shared", "@xjoy/db", "@xjoy/api"],
  headers: async () => [
    {
      source: "/manifest.json",
      headers: [{ key: "Content-Type", value: "application/manifest+json" }],
    },
  ],
};

export default nextConfig;
```

**关键注意事项**：

1. **`output: "export"`** 会将 Next.js 编译为纯静态 HTML/CSS/JS，输出到 `out/` 目录。
2. **`images: { unoptimized: true }`**：GitHub Pages 不支持 Next.js Image Optimization。
3. **`basePath` / `assetPrefix`**：
   - 如果部署到 `https://<user>.github.io/xjoy/`（项目 Pages），需要设置 `basePath: "/xjoy"`。
   - 如果部署到 `https://<user>.github.io/`（用户 Pages），不需要设置。
   - **重要**：上面示例中 `basePath` 仅在 GitHub Actions 环境下设置。本地开发时为空，保持 `localhost:3000` 正常工作。
4. **API Routes 无法导出**：所有 `route.ts` 文件在 `output: "export"` 模式下不生成页面，需要确保没有页面依赖 API 路由。

**构建命令**：
```bash
cd packages/app && pnpm build
# 输出目录：packages/app/out/
```

---

### Step 4: 生成静态路径（动态路由）(1-2h)

**文件**：`packages/app/src/app/reader/[book]/[chapter]/page.tsx`

**当前状态**：该页面是 async Server Component（`export default async function ChapterPage`），在静态导出模式下需要 `generateStaticParams` 预生成所有路径。

**修改**：将页面改为客户端组件或添加 `generateStaticParams`。

```typescript
// 在 page.tsx 同文件中添加：

/**
 * 静态生成所有书卷章节路径。
 * 66 卷书 × 平均 18 章 ≈ 1,189 个路径。
 * 构建时间：约 30-60 秒（首次），后续增量构建更快。
 */
export async function generateStaticParams() {
  // 从 KJV 数据中提取所有 (book, chapter) 组合
  const fs = await import("fs");
  const path = await import("path");

  const dataPath = path.resolve(
    process.cwd(),
    "data/kjv.json"
  );
  const raw = fs.readFileSync(dataPath, "utf-8");
  const data: { verses: { book: string; chapter: number }[] } = JSON.parse(raw);

  // 去重 book-chapter 组合
  const seen = new Set<string>();
  const params: { book: string; chapter: string }[] = [];

  for (const v of data.verses) {
    const key = `${v.book}|${v.chapter}`;
    if (!seen.has(key)) {
      seen.add(key);
      params.push({
        book: v.book,
        chapter: String(v.chapter),
      });
    }
  }

  console.log(`[generateStaticParams] 生成 ${params.length} 个路径`);
  return params;
}
```

**同时处理**：
- `packages/app/src/app/reader/[book]/page.tsx`：书卷首页（重定向到第 1 章或显示书卷信息）
- 确保 `generateStaticParams` 生成的路径可通过静态文件访问。

**注意**：如果 ChapterPage 包含 `"use client"` 交互（ReadingProgressTracker 等），需要将其拆分为：
- 服务端部分：`generateStaticParams` + `generateMetadata`
- 客户端部分：包裹在 `"use client"` 组件中

---

### Step 5: localStorage 替代方案（用户数据）(2-3h)

**文件**：`packages/app/src/lib/storage.ts`（新建或扩展现有模块）

**目的**：Neon 数据库在静态部署下不可用，用 localStorage 替代笔记、书签、阅读进度等功能。

**实现**：

```typescript
// packages/app/src/lib/storage.ts

const PREFIX = "xjoy:";

export const storage = {
  // ── 阅读进度 ────────────────────────────────────────────────
  getReadingPosition(): { book: string; chapter: number } | null {
    try {
      const raw = localStorage.getItem(`${PREFIX}reading-position`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setReadingPosition(book: string, chapter: number): void {
    localStorage.setItem(
      `${PREFIX}reading-position`,
      JSON.stringify({ book, chapter })
    );
  },

  // ── 书签 ────────────────────────────────────────────────────
  getBookmarks(): { book: string; chapter: number; verse: number; note?: string }[] {
    try {
      const raw = localStorage.getItem(`${PREFIX}bookmarks`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  addBookmark(book: string, chapter: number, verse: number, note?: string): void {
    const bookmarks = this.getBookmarks();
    bookmarks.push({ book, chapter, verse, note, createdAt: Date.now() });
    localStorage.setItem(`${PREFIX}bookmarks`, JSON.stringify(bookmarks));
  },

  removeBookmark(book: string, chapter: number, verse: number): void {
    const bookmarks = this.getBookmarks().filter(
      (b) => !(b.book === book && b.chapter === chapter && b.verse === verse)
    );
    localStorage.setItem(`${PREFIX}bookmarks`, JSON.stringify(bookmarks));
  },

  // ── 笔记 ────────────────────────────────────────────────────
  getNotes(): { id: string; book: string; chapter: number; verse?: number; content: string; createdAt: number }[] {
    try {
      const raw = localStorage.getItem(`${PREFIX}notes`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveNote(note: { book: string; chapter: number; verse?: number; content: string }): void {
    const notes = this.getNotes();
    notes.push({ ...note, id: crypto.randomUUID(), createdAt: Date.now() });
    localStorage.setItem(`${PREFIX}notes`, JSON.stringify(notes));
  },

  deleteNote(id: string): void {
    const notes = this.getNotes().filter((n) => n.id !== id);
    localStorage.setItem(`${PREFIX}notes`, JSON.stringify(notes));
  },
};
```

**修改范围**：
- `packages/app/src/components/ReadingProgressTracker.tsx`：改用 `storage.getReadingPosition/setReadingPosition`
- `packages/app/src/app/notes/`：改用 `storage.getNotes/saveNote/deleteNote`
- `packages/app/src/app/bookmarks/`：改用 `storage.getBookmarks/addBookmark/removeBookmark`
- `packages/app/src/app/reader/page.tsx`：改用 `storage.getReadingPosition`

**数据迁移提示**：在应用启动时检测是否有 localStorage 数据，如有则显示导入提示。测试用户首次使用时自动初始化空状态。

---

### Step 6: GitHub Pages 部署配置 (1-2h)

#### 6.1 创建 GitHub Actions 工作流

**文件**：`.github/workflows/deploy-pages.yml`（新建）

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Copy KJV data to public
        run: |
          mkdir -p packages/app/public/data
          cp packages/app/data/kjv.json packages/app/public/data/kjv.json

      - name: Build static export
        run: cd packages/app && pnpm build
        env:
          NEXT_TELEMETRY_DISABLED: 1
          # 如果使用 basePath:
          # NEXT_PUBLIC_BASE_PATH: /xjoy

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: packages/app/out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

#### 6.2 配置 GitHub Pages 源

1. 仓库 Settings → Pages
2. Source: **GitHub Actions**
3. 等待首次部署完成

#### 6.3 验证部署

```bash
# 部署后检查
curl -I https://<user>.github.io/xjoy/
# 预期：HTTP 200 + Content-Type: text/html
```

---

### Step 7: 测试与验证 (2-3h)

#### 7.1 本地静态构建验证

```bash
cd packages/app

# 1. 安装依赖
pnpm install

# 2. 确保 KJV 数据在 public 目录
mkdir -p public/data
cp data/kjv.json public/data/kjv.json

# 3. 构建静态导出
pnpm build
# 输出：packages/app/out/

# 4. 本地验证静态文件
npx serve out
# 打开 http://localhost:3000 验证以下功能：
```

#### 7.2 冒烟测试清单

| # | 测试项 | 预期结果 |
|---|--------|----------|
| 1 | 首页加载 | 显示"Xjoy — AI 智慧圣经"标题、导航和 CTA 按钮 |
| 2 | 读经 → Genesis 1 | 显示创世记第 1 章全部 31 节经文 |
| 3 | 读经 → Revelation 22 | 显示启示录第 22 章全部 21 节经文 |
| 4 | 章节导航（上一章/下一章） | Genesis 1 → Genesis 2 → Genesis 3，链接可点击 |
| 5 | 书卷列表（/catalog） | 显示全部 66 卷书，可点击进入 |
| 6 | 搜索"faith" | 返回包含 faith 的经文结果列表 |
| 7 | 搜索"爱" | 返回中文搜索结果 |
| 8 | 搜索结果点击 | 跳转到对应章节并高亮定位 |
| 9 | 书签添加/查看 | 添加书签后可查看列表 |
| 10 | 笔记添加/查看 | 添加笔记后可查看和删除 |
| 11 | 阅读进度恢复 | 关闭页面后重新打开，回到上次阅读位置 |
| 12 | PWA 离线 | 断网后仍可浏览已缓存的页面 |
| 13 | PWA 安装 | 浏览器提示"添加到主屏幕" |
| 14 | 移动端响应式 | iPhone SE / iPad 尺寸下布局正常 |
| 15 | 暗色模式 | 切换系统暗色模式，UI 正确切换 |
| 16 | AI 聊天页面 | 显示"即将上线"占位，无 JS 报错 |
| 17 | 404 页面 | 不存在的章节显示友好 404 |

#### 7.3 中国可访问性验证

```bash
# 使用在线工具或请中国用户测试：
# 1. 浏览器直接打开 https://<user>.github.io/xjoy/
# 2. 确认页面加载时间 < 5 秒
# 3. 确认 KJV 数据（5.7MB）加载成功
# 4. 确认搜索功能正常
```

**备选验证**：如果无法在中国测试，使用 VPN 模拟或请 @board 安排中国用户验证。

#### 7.4 性能基准

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 首次内容绘制 (FCP) | < 2s | 首页 HTML 加载 |
| KJV 数据加载 | < 3s | 5.7MB JSON 下载 |
| 搜索响应 | < 500ms | 内存索引查询 |
| 页面切换（章节） | < 1s | 预渲染的静态 HTML |
| Lighthouse 评分 | > 90 | PWA + 性能 + SEO |

---

## 常见问题

### Q1: kjv.json 5.7MB 太大，首次加载慢怎么办？

**方案 A（推荐）**：GitHub Pages 默认启用 CDN 和 gzip 压缩。5.7MB JSON 压缩后约 1.5MB。在良好网络下 2-3 秒可加载。

**方案 B**：按书卷拆分 JSON 文件（`genesis.json`, `exodus.json`...），按需加载。增加复杂度但减少首屏加载时间。

**方案 C**：使用 Service Worker 预缓存 kjv.json，首次加载后永久离线可用。

当前采用方案 A（简单优先），测试用户反馈后再优化。

### Q2: Search 性能如何保证？

现有 `packages/db/src/local-search.ts` 已实现客户端搜索算法（tokenize + TF-IDF）。在静态部署中，将此逻辑移植到客户端模块，在 kjv.json 加载完成后构建内存索引。搜索 < 500ms。

### Q3: 是否需要处理 basePath？

如果部署到 `https://<user>.github.io/xjoy/`（仓库级 Pages，不是用户级 Pages），需要：
1. `next.config.ts` 中设置 `basePath: "/xjoy"`
2. 所有 `<Link href="...">` 会自动添加 basePath
3. `public/` 中的资源引用需要手动处理

### Q4: 用户数据（笔记/书签）会丢失吗？

- **当前 Vercel 部署**：数据存储在 Neon PostgreSQL。
- **静态部署**：数据存储在浏览器 localStorage。
- **迁移**：不自动迁移。在测试阶段（5-10 用户），手动告知用户重新添加书签。后续可通过导出/导入 JSON 文件实现数据迁移。

### Q5: AI 聊天功能如何后续补齐？

两个路径：
1. **API 代理**：部署一个轻量 API 服务（如 Cloudflare Workers）转发到 Anthropic API。GitHub Pages 前端通过 CORS 调用。优势：保留完整 AI 功能；劣势：需要额外服务。
2. **预生成回答**：对 100 个最常见问题预生成 AI 回答，构建时嵌入 JSON。优势：纯静态；劣势：只能回答预设问题。

CEO 推荐路径 1（Cloudflare Workers 代理），在用户测试验证核心读经体验后再实施。

---

## 回退计划

如果 GitHub Pages 部署出现问题，可以随时回退到 Vercel：

```bash
# 1. 恢复 next.config.ts 中的 output: "export"
# 2. 重新部署到 Vercel
git push origin main  # Vercel 自动部署
```

Vercel 部署仍然保留（`xjoy-gray.vercel.app`），只是中国用户无法访问。海外用户仍可使用。

---

## 后续：重连 XJO-7 用户测试

静态部署完成并验证中国可达后：

1. 在 XJO-7 issue 评论 `@CEO D-Day 已确认，URL = https://<user>.github.io/xjoy/`
2. CEO 恢复用户测试执行
3. 发送招募邀请（材料已就绪，见 `docs/testing/`）
4. 1 周测试期 → 收集反馈 → 分类 → 创建后续 issue
