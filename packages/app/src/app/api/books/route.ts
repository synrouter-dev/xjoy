/**
 * Books API — GET list of all Bible books with metadata.
 *
 * Response: { books: BookMeta[] }
 */

import { NextResponse } from "next/server";
import { getBooks } from "@xjoy/shared";

export const runtime = "nodejs";

export async function GET() {
  try {
    const books = getBooks();
    return NextResponse.json({ books });
  } catch (err) {
    console.error("GET /api/books error:", err);
    return NextResponse.json(
      { error: "获取书卷列表失败" },
      { status: 500 }
    );
  }
}
