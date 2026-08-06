/**
 * Reading Progress API 测试。
 *
 * 通过 mock 数据层测试阅读进度 API：
 * - GET（统计信息、历史记录）
 * - POST（记录阅读进度）
 */

import { describe, it, expect, jest } from "@jest/globals";

// ── Mock 数据层 ─────────────────────────────────────────────────────────────

const mockRecordReading = jest.fn();
const mockGetReadingHistory = jest.fn();
const mockGetReadingStats = jest.fn();

jest.mock("@/lib/reading-progress", () => ({
  recordReading: (...args: unknown[]) => mockRecordReading(...args),
  getReadingHistory: (...args: unknown[]) => mockGetReadingHistory(...args),
  getReadingStats: (...args: unknown[]) => mockGetReadingStats(...args),
}));

import { GET, POST } from "@/app/api/reading-progress/route";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Reading Progress API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── GET ────────────────────────────────────────────────────────────────────

  describe("GET /api/reading-progress", () => {
    it("获取阅读统计数据（?stats=true）", async () => {
      const mockStats = {
        total_chapters_read: 50,
        total_books_started: 5,
        last_read_book: "John",
        last_read_chapter: 3,
        last_read_at: "2026-01-05T00:00:00Z",
      };
      mockGetReadingStats.mockResolvedValueOnce(mockStats);

      const res = await GET(new Request("http://localhost/api/reading-progress?stats=true"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.stats).toEqual(mockStats);
    });

    it("默认获取阅读历史列表", async () => {
      const mockHistory = [
        { id: 1, book: "John", chapter: 3, read_at: "2026-01-05T00:00:00Z" },
        { id: 2, book: "Genesis", chapter: 1, read_at: "2026-01-04T00:00:00Z" },
      ];
      mockGetReadingHistory.mockResolvedValueOnce(mockHistory);

      const res = await GET(new Request("http://localhost/api/reading-progress"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.history).toEqual(mockHistory);
      expect(mockGetReadingHistory).toHaveBeenCalledWith(50);
    });

    it("自定义 limit", async () => {
      mockGetReadingHistory.mockResolvedValueOnce([]);

      const res = await GET(new Request("http://localhost/api/reading-progress?limit=10"));
      await res.json();

      expect(mockGetReadingHistory).toHaveBeenCalledWith(10);
    });

    it("limit 上限为 200", async () => {
      mockGetReadingHistory.mockResolvedValueOnce([]);

      const res = await GET(new Request("http://localhost/api/reading-progress?limit=500"));
      await res.json();

      expect(mockGetReadingHistory).toHaveBeenCalledWith(200);
    });

    it("数据库错误时返回 500", async () => {
      mockGetReadingHistory.mockRejectedValueOnce(new Error("DB error"));

      const res = await GET(new Request("http://localhost/api/reading-progress"));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBeDefined();
    });
  });

  // ── POST ───────────────────────────────────────────────────────────────────

  describe("POST /api/reading-progress", () => {
    it("成功记录阅读进度", async () => {
      const mockRecord = { id: 3, book: "Matthew", chapter: 5, read_at: "2026-01-06T00:00:00Z" };
      mockRecordReading.mockResolvedValueOnce(mockRecord);

      const req = new Request("http://localhost/api/reading-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book: "Matthew", chapter: 5 }),
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.record).toEqual(mockRecord);
      expect(mockRecordReading).toHaveBeenCalledWith({ book: "Matthew", chapter: 5 });
    });

    it("缺少 book 返回 400", async () => {
      const req = new Request("http://localhost/api/reading-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapter: 3 }),
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBeDefined();
    });

    it("chapter 不是数字返回 400", async () => {
      const req = new Request("http://localhost/api/reading-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book: "John", chapter: "three" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("重复阅读同一章也成功记录", async () => {
      mockRecordReading.mockResolvedValueOnce({
        id: 4, book: "John", chapter: 3, read_at: "2026-01-07T00:00:00Z",
      });

      const req = new Request("http://localhost/api/reading-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book: "John", chapter: 3 }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
    });
  });
});
