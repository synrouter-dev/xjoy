/**
 * Reading Progress API
 *
 * POST /api/reading-progress — record a chapter as read
 *   Body: { book, chapter }
 *
 * GET  /api/reading-progress — get reading stats + history
 *   Query: ?stats=true (returns stats) or ?history=true (returns timeline)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  recordReading,
  getReadingHistory,
  getReadingStats,
} from "@/lib/reading-progress";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    if (searchParams.get("stats") === "true") {
      const stats = await getReadingStats();
      return NextResponse.json({ stats });
    }

    const limit = Math.min(
      parseInt(searchParams.get("limit") || "50", 10),
      200
    );
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const history = await getReadingHistory(limit, offset);
    return NextResponse.json({ history });
  } catch (err) {
    console.error("GET /api/reading-progress error:", err);
    return NextResponse.json(
      { error: "获取阅读进度失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { book, chapter } = body;

    if (!book || typeof chapter !== "number") {
      return NextResponse.json(
        { error: "缺少必要参数：book, chapter" },
        { status: 400 }
      );
    }

    const record = await recordReading(book, chapter);
    return NextResponse.json({ record }, { status: 201 });
  } catch (err) {
    console.error("POST /api/reading-progress error:", err);
    return NextResponse.json(
      { error: "记录阅读进度失败" },
      { status: 500 }
    );
  }
}
