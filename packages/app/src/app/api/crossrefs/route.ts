/**
 * Cross-Reference API endpoint.
 *
 * GET /api/crossrefs?ref=John+3:16
 *
 * Returns TSK (Treasury of Scripture Knowledge) cross-references for a verse.
 * Data is sourced from the scrollmapper/bible_databases public domain collection.
 *
 * Response:
 *   {
 *     reference: "John 3:16",
 *     from: [{ book, chapter, verse_start, verse_end, votes }],  // refs FROM this verse
 *     to: [{ book, chapter, verse, votes }],                       // refs TO this verse
 *     total: number
 *   }
 */

import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import { join } from "path";

export const runtime = "nodejs";

// ── Types ────────────────────────────────────────────────────────────────────

interface CrossRefRow {
  book: string;
  chapter: number;
  verse?: number;
  verse_start?: number;
  verse_end?: number;
  votes: number;
}

// ── Reference Parser ─────────────────────────────────────────────────────────

function parseReference(ref: string): { book: string; chapter: number; verse: number } | null {
  const decoded = decodeURIComponent(ref.replace(/\+/g, " ")).trim();
  const match = decoded.match(/^((?:[123]\s+)?[A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+):(\d+)$/);
  if (!match) return null;
  return {
    book: match[1],
    chapter: parseInt(match[2], 10),
    verse: parseInt(match[3], 10),
  };
}

// ── Error Helper ─────────────────────────────────────────────────────────────

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const refParam = searchParams.get("ref");

  if (!refParam || refParam.trim().length === 0) {
    return errorResponse(
      "Missing 'ref' parameter. Use '?ref=Book+chapter:verse' (e.g., '?ref=John+3:16').",
      400
    );
  }

  const parsed = parseReference(refParam);
  if (!parsed) {
    return errorResponse(
      `Invalid reference format: "${refParam}". Use "Book Chapter:Verse" (e.g., "John+3:16").`,
      400
    );
  }

  const { book, chapter, verse } = parsed;

  try {
    const dbPath = join(process.cwd(), "data", "kjv.db");
    const db = new Database(dbPath, { readonly: true });

    try {
      const fromLimit = Math.min(
        parseInt(searchParams.get("fromLimit") || "30", 10),
        100
      );
      const toLimit = Math.min(
        parseInt(searchParams.get("toLimit") || "20", 10),
        100
      );

      // References FROM this verse
      const fromRows = db
        .prepare(
          `SELECT to_book AS book, to_chapter AS chapter,
                  to_verse_start AS verse_start, to_verse_end AS verse_end, votes
           FROM cross_references
           WHERE from_book = ? AND from_chapter = ? AND from_verse = ?
           ORDER BY votes DESC
           LIMIT ?`
        )
        .all(book, chapter, verse, fromLimit) as CrossRefRow[];

      // References TO this verse
      const toRows = db
        .prepare(
          `SELECT from_book AS book, from_chapter AS chapter,
                  from_verse AS verse, votes
           FROM cross_references
           WHERE to_book = ? AND to_chapter = ?
             AND to_verse_start <= ? AND to_verse_end >= ?
           ORDER BY votes DESC
           LIMIT ?`
        )
        .all(book, chapter, verse, verse, toLimit) as CrossRefRow[];

      db.close();

      return NextResponse.json({
        reference: `${book} ${chapter}:${verse}`,
        from: fromRows.map((r) => ({
          book: r.book,
          chapter: r.chapter,
          verse_start: r.verse_start,
          verse_end: r.verse_end,
          votes: r.votes,
        })),
        to: toRows.map((r) => ({
          book: r.book,
          chapter: r.chapter,
          verse: r.verse,
          votes: r.votes,
        })),
        fromCount: fromRows.length,
        toCount: toRows.length,
      });
    } finally {
      db.close();
    }
  } catch (err) {
    console.error("CrossRefs API error:", err);
    return errorResponse("An internal error occurred.", 500);
  }
}
