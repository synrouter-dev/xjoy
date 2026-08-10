/**
 * Study Stats API
 *
 * GET /api/study/stats — 获取学习统计数据（正确率、连续天数、完成章节等）
 */

import { NextResponse } from "next/server";
import { getStudyStats } from "@xjoy/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const stats = await getStudyStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error("Get study stats error:", err);
    return NextResponse.json(
      { error: "获取统计数据失败，请稍后重试。" },
      { status: 500 }
    );
  }
}
