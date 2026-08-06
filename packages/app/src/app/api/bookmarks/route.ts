/**
 * Bookmarks API — GET (list) / POST (add) / DELETE (remove by id)
 *
 * Query params:
 *   GET  /api/bookmarks?limit=50&offset=0
 *   DELETE /api/bookmarks?id=123
 *
 * Body (POST): { book, chapter, verse, note? }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getBookmarks,
  addBookmark,
  removeBookmark,
} from "@/lib/bookmarks";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const bookmarks = await getBookmarks(limit, offset);
    return NextResponse.json({ bookmarks });
  } catch (err) {
    console.error("GET /api/bookmarks error:", err);
    return NextResponse.json(
      { error: "获取书签失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { book, chapter, verse, note } = body;

    if (!book || typeof chapter !== "number" || typeof verse !== "number") {
      return NextResponse.json(
        { error: "缺少必要参数：book, chapter, verse" },
        { status: 400 }
      );
    }

    const bookmark = await addBookmark({ book, chapter, verse, note });
    return NextResponse.json({ bookmark }, { status: 201 });
  } catch (err) {
    console.error("POST /api/bookmarks error:", err);
    return NextResponse.json(
      { error: "添加书签失败" },
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

    const removed = await removeBookmark(id);
    if (!removed) {
      return NextResponse.json(
        { error: "书签不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/bookmarks error:", err);
    return NextResponse.json(
      { error: "删除书签失败" },
      { status: 500 }
    );
  }
}
