/**
 * Verse Lookup API endpoint.
 *
 * GET /api/verses?ref=John+3:16
 *
 * Parses a human-readable scripture reference and returns the matching
 * verse(s) from the database. Supports three formats:
 *
 *   - Single verse:  "John 3:16"
 *   - Verse range:   "John 3:16-18"
 *   - Full chapter:  "Genesis 1"
 *
 * Book names are matched case-insensitively against the canonical KJV list.
 *
 * Response:
 *   { reference: string, book: string, chapter: number, verses: Verse[], count: number }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getVerse,
  getChapter,
  getVerseRange,
  resolveBookName,
  isValidReference,
} from "@xjoy/shared";
import { searchVerses, searchVersesBroad } from "@xjoy/db";
import type { Verse } from "@xjoy/shared";

export const runtime = "nodejs";

// ── Reference Parser ───────────────────────────────────────────────────────────

interface ParsedReference {
  book: string; // canonical book name
  chapter: number;
  startVerse?: number;
  endVerse?: number;
}

/**
 * Parse a scripture reference string into its components.
 *
 * Supported formats:
 *   "John 3:16"           → single verse
 *   "John 3:16-17"        → verse range
 *   "Genesis 1"           → full chapter
 *   "1 Corinthians 13:4"  → numbered books
 *   "Song of Solomon 2:1" → multi-word books
 *
 * Throws on malformed or unrecognized references.
 */
function parseReference(ref: string): ParsedReference {
  const trimmed = ref.trim();

  // Match: Book Name chapter[:verse[-endVerse]]
  //  group 1: book name   (lazy — stops before the chapter number)
  //  group 2: chapter
  //  group 3: verse       (optional)
  //  group 4: end verse   (optional, only when verse present)
  const match = trimmed.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);

  if (!match) {
    throw new Error(
      `Invalid reference format: "${trimmed}". ` +
        "Use 'Book chapter:verse' (e.g., 'John 3:16'), " +
        "'Book chapter:start-end' (e.g., 'John 3:16-17'), " +
        "or 'Book chapter' (e.g., 'Genesis 1')."
    );
  }

  const rawBook = match[1].trim();
  const chapter = parseInt(match[2], 10);
  const startVerse = match[3] ? parseInt(match[3], 10) : undefined;
  const endVerse = match[4] ? parseInt(match[4], 10) : undefined;

  // ── Validate chapter/verse values ──

  if (chapter < 1) {
    throw new Error(`Invalid chapter: ${chapter}. Chapter must be >= 1.`);
  }

  if (startVerse !== undefined && startVerse < 1) {
    throw new Error(`Invalid verse: ${startVerse}. Verse must be >= 1.`);
  }

  if (endVerse !== undefined) {
    if (startVerse === undefined) {
      throw new Error(
        "Invalid reference: end verse specified without start verse."
      );
    }
    if (endVerse < startVerse) {
      throw new Error(
        `Invalid verse range: end verse (${endVerse}) must be >= start verse (${startVerse}).`
      );
    }
  }

  // ── Case-insensitive book name lookup (with abbreviation support) ──

  const canonicalBook = resolveBookName(rawBook);

  if (!canonicalBook) {
    throw new Error(
      `Unknown book: "${rawBook}". ` +
        "Use the full book name (e.g., 'John', '1 Corinthians', 'Song of Solomon') " +
        "or a common abbreviation (e.g., 'Jn', '1 Cor', 'Song')."
    );
  }

  return { book: canonicalBook, chapter, startVerse, endVerse };
}

// ── Response Helpers ───────────────────────────────────────────────────────────

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

interface VersesResponse {
  reference: string;
  book: string;
  chapter: number;
  verses: Verse[];
  count: number;
}

function successResponse(
  ref: string,
  book: string,
  chapter: number,
  verses: Verse[]
): NextResponse<VersesResponse> {
  return NextResponse.json({
    reference: ref,
    book,
    chapter,
    verses,
    count: verses.length,
  });
}

// ── GET Handler ────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // ── Keyword search ──
  const searchQuery = request.nextUrl.searchParams.get("q");
  if (searchQuery && searchQuery.trim().length > 0) {
    try {
      const query = searchQuery.trim();
      if (query.length > 200) {
        return errorResponse("搜索词过长，最多 200 个字符。", 400);
      }
      const limit = Math.min(
        parseInt(request.nextUrl.searchParams.get("limit") || "20", 10),
        50
      );
      // Try strict search first, fall back to broad
      let results = await searchVerses(query, limit);
      if (results.length < 3) {
        const broad = await searchVersesBroad(query, limit);
        // Merge deduplicated
        const seen = new Set(results.map((r) => r.id));
        for (const r of broad) {
          if (!seen.has(r.id)) {
            results.push(r);
            seen.add(r.id);
          }
        }
        results = results.slice(0, limit);
      }
      return NextResponse.json({ results, count: results.length });
    } catch (err) {
      console.error("Search API error:", err);
      return errorResponse("搜索失败，请稍后重试。", 500);
    }
  }

  // ── 1. Extract & validate the `ref` parameter ──

  const ref = request.nextUrl.searchParams.get("ref");

  if (!ref || ref.trim().length === 0) {
    return errorResponse(
      "缺少参数。使用 '?q=关键词' 进行搜索，或 '?ref=书卷+章节:节' 查询经文（例如 '?ref=John+3:16'）。",
      400
    );
  }

  if (ref.length > 200) {
    return errorResponse(
      "Reference string is too long. Maximum 200 characters.",
      400
    );
  }

  // ── 2. Parse the reference ──

  let parsed: ParsedReference;
  try {
    parsed = parseReference(ref);
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Invalid reference.",
      400
    );
  }

  const { book, chapter, startVerse, endVerse } = parsed;

  // ── 3. Validate reference against canonical bounds ──

  if (!isValidReference(book, chapter)) {
    return errorResponse(
      `Invalid reference: "${book} ${chapter}" — ` +
        "this chapter does not exist. Check the book name and chapter number.",
      400
    );
  }

  // ── 4. Query the in-memory data ──

  try {
    let verses: Verse[];

    if (startVerse !== undefined && endVerse !== undefined) {
      // Verse range: "John 3:16-18"
      verses = getVerseRange(book, chapter, startVerse, endVerse);
    } else if (startVerse !== undefined) {
      // Single verse: "John 3:16"
      const verse = getVerse(book, chapter, startVerse);
      verses = verse ? [verse] : [];
    } else {
      // Full chapter: "Genesis 1"
      verses = getChapter(book, chapter);
    }

    // ── 5. Handle empty results ──

    if (verses.length === 0) {
      const detail =
        startVerse !== undefined
          ? `${book} ${chapter}:${startVerse}${endVerse ? `-${endVerse}` : ""}`
          : `${book} ${chapter}`;

      return errorResponse(
        `No verses found for "${detail}". The verse(s) may be out of range — ` +
          "check that the verse number(s) exist within this chapter.",
        404
      );
    }

    return successResponse(ref.trim(), book, chapter, verses);
  } catch (err) {
    console.error("Verses API error:", err);

    // Data file not found — operational error
    if (
      err instanceof Error &&
      (err.message.includes("ENOENT") || err.message.includes("no such file"))
    ) {
      return errorResponse(
        "KJV data file is not available. Please ensure data/kjv.json exists.",
        503
      );
    }

    return errorResponse("An internal error occurred. Please try again.", 500);
  }
}
