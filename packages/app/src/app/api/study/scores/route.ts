/**
 * Study Scores API
 *
 * POST /api/study/scores — 保存游戏成绩并更新连续天数
 * GET  /api/study/scores?type=quiz|jigsaw — 获取最近成绩
 */

import { NextRequest, NextResponse } from "next/server";
import { saveScore, getRecentScores } from "@xjoy/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { game_type, score, total, accuracy, time_seconds, difficulty, book, chapter, details } = body;

    if (!game_type || !["quiz", "jigsaw"].includes(game_type)) {
      return NextResponse.json(
        { error: "game_type 必须为 quiz 或 jigsaw" },
        { status: 400 }
      );
    }

    if (typeof score !== "number" || typeof total !== "number") {
      return NextResponse.json(
        { error: "score 和 total 必须为数字" },
        { status: 400 }
      );
    }

    const result = await saveScore({
      game_type,
      score,
      total,
      accuracy,
      time_seconds,
      difficulty,
      book,
      chapter,
      details,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("Save score error:", err);
    return NextResponse.json(
      { error: "保存成绩失败，请稍后重试。" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const typeParam = request.nextUrl.searchParams.get("type");
    const game_type =
      typeParam === "quiz" || typeParam === "jigsaw" ? typeParam : undefined;

    const scores = await getRecentScores(game_type);
    return NextResponse.json(scores);
  } catch (err) {
    console.error("Get scores error:", err);
    return NextResponse.json(
      { error: "获取成绩失败，请稍后重试。" },
      { status: 500 }
    );
  }
}
