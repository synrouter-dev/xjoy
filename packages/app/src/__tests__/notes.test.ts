/**
 * Notes API 测试。
 *
 * 通过 mock 数据层测试笔记 API 的所有端点：
 * - GET（列表、按 ID 单条、按经文查找）
 * - POST（创建笔记）
 * - PUT（更新笔记）
 * - DELETE（删除笔记）
 */

import { describe, it, expect, jest } from "@jest/globals";

// ── Mock 数据层 ─────────────────────────────────────────────────────────────

const mockGetNotes = jest.fn();
const mockGetNote = jest.fn();
const mockGetNotesForVerse = jest.fn();
const mockCreateNote = jest.fn();
const mockUpdateNote = jest.fn();
const mockDeleteNote = jest.fn();

jest.mock("@/lib/notes", () => ({
  getNotes: (...args: unknown[]) => mockGetNotes(...args),
  getNote: (...args: unknown[]) => mockGetNote(...args),
  getNotesForVerse: (...args: unknown[]) => mockGetNotesForVerse(...args),
  createNote: (...args: unknown[]) => mockCreateNote(...args),
  updateNote: (...args: unknown[]) => mockUpdateNote(...args),
  deleteNote: (...args: unknown[]) => mockDeleteNote(...args),
}));

import { GET, POST, PUT, DELETE } from "@/app/api/notes/route";

function postBody(body: unknown): Request {
  return new Request("http://localhost/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function putBody(body: unknown): Request {
  return new Request("http://localhost/api/notes", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Notes API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── GET ────────────────────────────────────────────────────────────────────

  describe("GET /api/notes", () => {
    it("按 ID 获取单条笔记", async () => {
      const mock = { id: 1, book: "John", chapter: 3, verse: 16, content: "神爱世人", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" };
      mockGetNote.mockResolvedValueOnce(mock);

      const res = await GET(new Request("http://localhost/api/notes?id=1"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.note).toEqual(mock);
    });

    it("笔记不存在返回 404", async () => {
      mockGetNote.mockResolvedValueOnce(null);

      const res = await GET(new Request("http://localhost/api/notes?id=999"));
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBeDefined();
    });

    it("按经文引用查找笔记", async () => {
      const mockNotes = [
        { id: 2, book: "John", chapter: 3, verse: 16, content: "核心经文", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
        { id: 3, book: "John", chapter: 3, verse: 16, content: "再思神爱", created_at: "2026-01-02T00:00:00Z", updated_at: "2026-01-02T00:00:00Z" },
      ];
      mockGetNotesForVerse.mockResolvedValueOnce(mockNotes);

      const res = await GET(new Request("http://localhost/api/notes?book=John&chapter=3&verse=16"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.notes).toHaveLength(2);
      expect(mockGetNotesForVerse).toHaveBeenCalledWith("John", 3, 16);
    });

    it("经文查找 chapter 非数字返回 400", async () => {
      const res = await GET(new Request("http://localhost/api/notes?book=John&chapter=abc&verse=16"));
      const body = await res.json();

      expect(res.status).toBe(400);
    });

    it("默认分页获取笔记列表", async () => {
      mockGetNotes.mockResolvedValueOnce([]);

      const res = await GET(new Request("http://localhost/api/notes"));
      await res.json();

      expect(mockGetNotes).toHaveBeenCalledWith(50, 0);
    });

    it("自定义 limit 和 offset", async () => {
      mockGetNotes.mockResolvedValueOnce([]);

      const res = await GET(new Request("http://localhost/api/notes?limit=20&offset=10"));
      await res.json();

      expect(mockGetNotes).toHaveBeenCalledWith(20, 10);
    });
  });

  // ── POST ───────────────────────────────────────────────────────────────────

  describe("POST /api/notes", () => {
    it("成功创建笔记", async () => {
      const mock = { id: 4, book: "Psalms", chapter: 23, verse: 1, content: "耶和华是我的牧者", created_at: "2026-01-03T00:00:00Z", updated_at: "2026-01-03T00:00:00Z" };
      mockCreateNote.mockResolvedValueOnce(mock);

      const res = await POST(postBody({
        book: "Psalms", chapter: 23, verse: 1, content: "耶和华是我的牧者",
      }));
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.note).toEqual(mock);
    });

    it("缺少 content 返回 400", async () => {
      const res = await POST(postBody({ book: "John", chapter: 3, verse: 16 }));
      const body = await res.json();
      expect(res.status).toBe(400);
    });

    it("缺少 book 返回 400", async () => {
      const res = await POST(postBody({ chapter: 3, verse: 16, content: "test" }));
      expect(res.status).toBe(400);
    });

    it("chapter 不是数字返回 400", async () => {
      const res = await POST(postBody({ book: "John", chapter: "three", verse: 16, content: "test" }));
      expect(res.status).toBe(400);
    });
  });

  // ── PUT ────────────────────────────────────────────────────────────────────

  describe("PUT /api/notes", () => {
    it("成功更新笔记", async () => {
      const updated = { id: 1, book: "John", chapter: 3, verse: 16, content: "更新后的内容", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-05T00:00:00Z" };
      mockUpdateNote.mockResolvedValueOnce(updated);

      const res = await PUT(putBody({ id: 1, content: "更新后的内容" }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.note).toEqual(updated);
    });

    it("笔记不存在返回 404", async () => {
      mockUpdateNote.mockResolvedValueOnce(null);

      const res = await PUT(putBody({ id: 999, content: "更新" }));
      expect(res.status).toBe(404);
    });

    it("缺少 id 返回 400", async () => {
      const res = await PUT(putBody({ content: "无ID" }));
      expect(res.status).toBe(400);
    });

    it("缺少 content 返回 400", async () => {
      const res = await PUT(putBody({ id: 1 }));
      expect(res.status).toBe(400);
    });
  });

  // ── DELETE ─────────────────────────────────────────────────────────────────

  describe("DELETE /api/notes", () => {
    it("成功删除笔记", async () => {
      mockDeleteNote.mockResolvedValueOnce(true);

      const res = await DELETE(new Request("http://localhost/api/notes?id=1"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("笔记不存在返回 404", async () => {
      mockDeleteNote.mockResolvedValueOnce(false);

      const res = await DELETE(new Request("http://localhost/api/notes?id=999"));
      expect(res.status).toBe(404);
    });

    it("缺少 id 返回 400", async () => {
      const res = await DELETE(new Request("http://localhost/api/notes"));
      expect(res.status).toBe(400);
    });
  });
});
