/**
 * Notes API — GET (list) / POST (create) / PUT (update) / DELETE (remove)
 *
 * Query params:
 *   GET  /api/notes?limit=50&offset=0            — paginated list
 *   GET  /api/notes?id=123                         — single note by id
 *   GET  /api/notes?book=John&chapter=3&verse=16  — notes for a specific verse
 *   DELETE /api/notes?id=123
 *
 * Body (POST): { book, chapter, verse, content }
 * Body (PUT): { id, content }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getNotes,
  getNote,
  getNotesForVerse,
  createNote,
  updateNote,
  deleteNote,
} from "@/lib/notes";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "", 10);

    if (!isNaN(id)) {
      const note = await getNote(id);
      if (!note) {
        return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
      }
      return NextResponse.json({ note });
    }

    // Verse-specific query: ?book=John&chapter=3&verse=16
    const book = searchParams.get("book");
    const chapterStr = searchParams.get("chapter");
    const verseStr = searchParams.get("verse");

    if (book && chapterStr && verseStr) {
      const chapter = parseInt(chapterStr, 10);
      const verse = parseInt(verseStr, 10);

      if (isNaN(chapter) || isNaN(verse)) {
        return NextResponse.json(
          { error: "chapter 和 verse 必须为数字" },
          { status: 400 }
        );
      }

      const verseNotes = await getNotesForVerse(book, chapter, verse);
      return NextResponse.json({ notes: verseNotes });
    }

    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const notes = await getNotes(limit, offset);
    return NextResponse.json({ notes });
  } catch (err) {
    console.error("GET /api/notes error:", err);
    return NextResponse.json(
      { error: "获取笔记失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { book, chapter, verse, content } = body;

    if (!book || typeof chapter !== "number" || typeof verse !== "number" || !content) {
      return NextResponse.json(
        { error: "缺少必要参数：book, chapter, verse, content" },
        { status: 400 }
      );
    }

    const note = await createNote({ book, chapter, verse, content });
    return NextResponse.json({ note }, { status: 201 });
  } catch (err) {
    console.error("POST /api/notes error:", err);
    return NextResponse.json(
      { error: "创建笔记失败" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content } = body;

    if (!id || !content) {
      return NextResponse.json(
        { error: "缺少必要参数：id, content" },
        { status: 400 }
      );
    }

    const note = await updateNote(id, { content });
    if (!note) {
      return NextResponse.json(
        { error: "笔记不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ note });
  } catch (err) {
    console.error("PUT /api/notes error:", err);
    return NextResponse.json(
      { error: "更新笔记失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "", 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "缺少参数：id" },
        { status: 400 }
      );
    }

    const removed = await deleteNote(id);
    if (!removed) {
      return NextResponse.json(
        { error: "笔记不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/notes error:", err);
    return NextResponse.json(
      { error: "删除笔记失败" },
      { status: 500 }
    );
  }
}
