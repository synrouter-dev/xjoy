/**
 * Bookmarks API 测试。
 *
 * 通过 mock 数据层来测试 API 路由的：
 * - 请求参数验证（缺失、无效类型）
 * - 成功路径的响应格式
 * - 错误处理
 */

import { describe, it, expect, jest } from "@jest/globals";

// ── Mock 数据层 ─────────────────────────────────────────────────────────────

const mockAddBookmark = jest.fn();
const mockGetBookmarks = jest.fn();
const mockRemoveBookmark = jest.fn();

jest.mock("@/lib/bookmarks", () => ({
  addBookmark: (...args: unknown[]) => mockAddBookmark(...args),
  getBookmarks: (...args: unknown[]) => mockGetBookmarks(...args),
  removeBookmark: (...args: unknown[]) => mockRemoveBookmark(...args),
}));

// ── 动态导入（mock 后） ─────────────────────────────────────────────────────

import { GET, POST, DELETE } from "@/app/api/bookmarks/route";

function createRequest(url: string, init?: { method?: string; body?: unknown }): Request {
  const req = new Request(`http://localhost${url}`, {
    method: init?.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    ...(init?.body ? { body: JSON.stringify(init.body) } : {}),
  });
  return req;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Bookmarks API", () => {
  beforeEach(() => {
    mockAddBookmark.mockReset();
    mockGetBookmarks.mockReset();
    mockRemoveBookmark.mockReset();
  });

  // ── GET ────────────────────────────────────────────────────────────────────

  describe("GET /api/bookmarks", () => {
    it("返回书签列表（默认分页）", async () => {
      const mockData = [
        { id: 1, book: "John", chapter: 3, verse: 16, note: "神爱世人", created_at: "2026-01-01T00:00:00Z" },
        { id: 2, book: "Genesis", chapter: 1, verse: 1, note: null, created_at: "2026-01-02T00:00:00Z" },
      ];
      mockGetBookmarks.mockResolvedValueOnce(mockData);

      const res = await GET(new Request("http://localhost/api/bookmarks"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.bookmarks).toEqual(mockData);
      expect(mockGetBookmarks).toHaveBeenCalledWith(50, 0);
    });

    it("支持自定义 limit 和 offset", async () => {
      mockGetBookmarks.mockResolvedValueOnce([]);

      const res = await GET(new Request("http://localhost/api/bookmarks?limit=10&offset=5"));
      await res.json();

      expect(mockGetBookmarks).toHaveBeenCalledWith(10, 5);
    });

    it("limit 上限为 200", async () => {
      mockGetBookmarks.mockResolvedValueOnce([]);

      const res = await GET(new Request("http://localhost/api/bookmarks?limit=999"));
      await res.json();

      expect(mockGetBookmarks).toHaveBeenCalledWith(200, 0);
    });

    it("数据库错误时返回 500", async () => {
      mockGetBookmarks.mockRejectedValueOnce(new Error("DB down"));

      const res = await GET(new Request("http://localhost/api/bookmarks"));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBeDefined();
    });
  });

  // ── POST ───────────────────────────────────────────────────────────────────

  describe("POST /api/bookmarks", () => {
    it("成功添加书签", async () => {
      const mockBookmark = {
        id: 3,
        book: "Psalms",
        chapter: 23,
        verse: 1,
        note: "耶和华是我的牧者",
        created_at: "2026-01-03T00:00:00Z",
      };
      mockAddBookmark.mockResolvedValueOnce(mockBookmark);

      const req = createRequest("/api/bookmarks", {
        method: "POST",
        body: { book: "Psalms", chapter: 23, verse: 1, note: "耶和华是我的牧者" },
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.bookmark).toEqual(mockBookmark);
    });

    it("缺少 book 参数时返回 400", async () => {
      const req = createRequest("/api/bookmarks", {
        method: "POST",
        body: { chapter: 3, verse: 16 },
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBeDefined();
    });

    it("chapter 不是数字时返回 400", async () => {
      const req = createRequest("/api/bookmarks", {
        method: "POST",
        body: { book: "John", chapter: "three", verse: 16 },
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
    });

    it("verse 不是数字时返回 400", async () => {
      const req = createRequest("/api/bookmarks", {
        method: "POST",
        body: { book: "John", chapter: 3, verse: "sixteen" },
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
    });

    it("无 note 的书签也能成功", async () => {
      mockAddBookmark.mockResolvedValueOnce({
        id: 4, book: "John", chapter: 1, verse: 1, note: null, created_at: "2026-01-04T00:00:00Z",
      });

      const req = createRequest("/api/bookmarks", {
        method: "POST",
        body: { book: "John", chapter: 1, verse: 1 },
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
    });
  });

  // ── DELETE ─────────────────────────────────────────────────────────────────

  describe("DELETE /api/bookmarks", () => {
    it("成功删除书签", async () => {
      mockRemoveBookmark.mockResolvedValueOnce(true);

      const res = await DELETE(new Request("http://localhost/api/bookmarks?id=1"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("书签不存在时返回 404", async () => {
      mockRemoveBookmark.mockResolvedValueOnce(false);

      const res = await DELETE(new Request("http://localhost/api/bookmarks?id=999"));
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBeDefined();
    });

    it("缺少 id 参数时返回 400", async () => {
      const res = await DELETE(new Request("http://localhost/api/bookmarks"));
      const body = await res.json();

      expect(res.status).toBe(400);
    });

    it("id 不是数字时返回 400", async () => {
      const res = await DELETE(new Request("http://localhost/api/bookmarks?id=abc"));
      const body = await res.json();

      expect(res.status).toBe(400);
    });
  });
});
