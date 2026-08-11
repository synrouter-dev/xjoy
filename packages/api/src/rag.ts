/**
 * RAG (Retrieval-Augmented Generation) pipeline.
 *
 * Orchestrates:
 *   1. Semantic retrieval — find relevant KJV verses for a user query
 *   2. Prompt construction — format retrieved verses into a grounding context
 *   3. Response generation — send to Claude with strict safety rules
 *
 * Safety is the top priority. The system prompt is designed to:
 *   - Prevent verse fabrication
 *   - Require citations for every scriptural claim
 *   - Ground all answers in the provided context
 */

import {
  searchVerses,
  searchVersesBroad,
  searchVersesByVector,
  localSearchVerses,
  isLocalSearchAvailable,
  type VerseSearchResult,
} from "@xjoy/db";
import OpenAI from "openai";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RagResult {
  /** The AI-generated response text. */
  answer: string;
  /** Verses cited in the response, for UI display. */
  citations: VerseCitation[];
  /** Verses used as context (for debugging/transparency). */
  contextVerses: VerseCitation[];
}

export interface VerseCitation {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

// ── System Prompt ─────────────────────────────────────────────────────────────

/**
 * The grounding system prompt.
 *
 * This is the most critical piece of the pipeline. It must:
 * 1. Define the AI's role and constraints
 * 2. Enforce strict citation rules
 * 3. Prevent fabrication
 * 4. Set the right theological tone
 */
const SYSTEM_PROMPT = `You are a knowledgeable Bible study assistant for the King James Version (KJV).

## Your Role
- Answer questions about scripture using ONLY the KJV verses provided below.
- Help users understand biblical context, themes, and connections between passages.
- Be reverent, thoughtful, and precise in your responses.

## ABSOLUTE RULES — VIOLATING THESE IS UNACCEPTABLE

### No Fabrication
- NEVER quote, paraphrase, or allude to a verse that is not in the provided context.
- If the provided verses don't answer the question, say so clearly: "The verses I have access to don't directly address this question. You might try asking with different wording, or consult a pastor or commentary for deeper study."
- NEVER invent verse text. If you don't have a verse, don't pretend you do.

### Citation Required
- EVERY time you reference scripture, you MUST cite it as: "Book Chapter:Verse" (e.g., "John 3:16").
- Place citations directly after the quoted or referenced verse text.
- Group related verses together when they speak to the same theme.

### Stay Grounded
- Base your entire response on the provided verses.
- You may explain the plain meaning of the text in its literary and historical context, but do not add doctrine, theology, or interpretations that go beyond the text.
- When there are multiple valid interpretations, acknowledge this without claiming certainty.

## Response Style
- Write in clear, warm, accessible English.
- Use short paragraphs. Avoid academic jargon.
- When helpful, point out connections between verses (e.g., "Notice how Paul echoes this theme in...").
- If the user seems to be struggling with something, be pastoral and compassionate while staying grounded in the text.
- End with an offer to explore related passages or answer follow-up questions.

## Context Format
The verses provided to you are from the KJV and are formatted as:
[Book Chapter:Verse] Verse text here.`;

// ── Prompt Builder ────────────────────────────────────────────────────────────

/**
 * Format retrieved verses into a context block for the LLM prompt.
 */
function formatVerseContext(verses: VerseSearchResult[]): string {
  if (verses.length === 0) {
    return "[No relevant verses found for this query.]";
  }

  const lines: string[] = ["## Relevant KJV Verses\n"];

  for (const v of verses) {
    lines.push(`[${v.book} ${v.chapter}:${v.verse}] ${v.text}`);
  }

  lines.push(
    "",
    "---",
    "Use the verses above to answer the user's question. Remember: cite every reference, never fabricate.",
    ""
  );

  return lines.join("\n");
}

/**
 * Build the full prompt for Claude.
 */
function buildPrompt(
  query: string,
  verses: VerseSearchResult[],
  conversationHistory?: { role: "user" | "assistant"; content: string }[]
): {
  systemPrompt: string;
  userMessage: string;
} {
  const verseContext = formatVerseContext(verses);

  const userMessage = conversationHistory
    ? [
        ...conversationHistory.map(
          (m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
        ),
        `User: ${query}`,
      ].join("\n\n")
    : query;

  return {
    systemPrompt: `${SYSTEM_PROMPT}\n\n${verseContext}`,
    userMessage,
  };
}

// ── Retrieval ─────────────────────────────────────────────────────────────────

const MIN_RESULTS = 3;
const DEFAULT_LIMIT = 12;

// ── Embedding Client ────────────────────────────────────────────────────────────

let embeddingClient: OpenAI | null = null;

function getEmbeddingClient(): OpenAI | null {
  if (embeddingClient) return embeddingClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OPENAI_API_KEY not set — vector search disabled, using FTS only.");
    return null;
  }
  embeddingClient = new OpenAI({ apiKey });
  return embeddingClient;
}

/**
 * Generate an embedding vector for a query string.
 * Returns null if the OpenAI API key is not configured.
 */
async function generateQueryEmbedding(query: string): Promise<number[] | null> {
  const client = getEmbeddingClient();
  if (!client) return null;

  try {
    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
      dimensions: 1536,
    });
    return response.data[0].embedding;
  } catch (err) {
    console.warn("Query embedding generation failed:", err);
    return null;
  }
}

// ── Hybrid Search ───────────────────────────────────────────────────────────────

/**
 * Retrieve relevant verses for a query using hybrid search.
 *
 * Strategy:
 *   1. Try vector search (semantic) — finds conceptually related verses
 *   2. Try FTS (keyword) — finds exact word matches
 *   3. Merge results, deduplicate, re-rank
 *   4. If vector search is unavailable (no OPENAI_API_KEY or no embeddings),
 *      falls back to FTS-only gracefully
 */
export async function retrieveVerses(
  query: string,
  limit: number = DEFAULT_LIMIT
): Promise<VerseSearchResult[]> {
  const results: VerseSearchResult[] = [];
  const seen = new Set<number>();

  try {
    // ── 1. Vector search (semantic) ──
    const embedding = await generateQueryEmbedding(query);
    if (embedding) {
      const vectorResults = await searchVersesByVector(embedding, limit);
      for (const r of vectorResults) {
        if (!seen.has(r.id!)) {
          seen.add(r.id!);
          results.push(r);
        }
      }
    }

    // ── 2. Full-text search (keyword) ──
    const ftsResults = await searchVerses(query, limit);

    // Fallback: if too few FTS results, try broader matching
    if (ftsResults.length < MIN_RESULTS) {
      const broadResults = await searchVersesBroad(query, limit);
      const ftsSeen = new Set(ftsResults.map((r) => r.id!));
      for (const r of broadResults) {
        if (!ftsSeen.has(r.id!)) {
          ftsSeen.add(r.id!);
          ftsResults.push(r);
        }
      }
    }

    // Merge FTS results (after vector results)
    for (const r of ftsResults) {
      if (!seen.has(r.id!)) {
        seen.add(r.id!);
        results.push(r);
      }
    }

    // ── 3. Re-rank ──
    results.sort((a, b) => b.rank - a.rank);
    return results.slice(0, limit);
  } catch (dbError) {
    // ── 数据库不可用 → 回退到本地搜索 ──
    console.warn(
      "[rag] PostgreSQL 搜索失败，回退到本地搜索:",
      dbError instanceof Error ? dbError.message : String(dbError)
    );

    if (!isLocalSearchAvailable()) {
      console.error("[rag] 本地搜索也不可用——无法检索经文");
      throw new Error(
        "经文检索不可用：数据库未连接且本地数据文件缺失。" +
        "请确认 Neon 数据库已连接或 data/kjv.json 存在。"
      );
    }

    console.log("[rag] 使用本地内存搜索（data/kjv.json）");
    return localSearchVerses(query, limit);
  }
}

// ── Citation Extraction ───────────────────────────────────────────────────────

/**
 * Map common AI-generated book name variations to canonical DB names.
 * Claude may write "Psalm" instead of "Psalms", "Song of Songs" vs "Song of Solomon", etc.
 */
const BOOK_NAME_ALIASES: Record<string, string> = {
  Psalm: "Psalms",
  "Song of Songs": "Song of Solomon",
  Canticles: "Song of Solomon",
};

/**
 * Fuzzy-match a book name from the AI response to a context verse's book.
 * Tries exact match first, then canonical aliases, then prefix match.
 */
function matchBook(
  aiBook: string,
  contextBook: string
): boolean {
  if (aiBook === contextBook) return true;

  // Check canonical aliases
  const canonical = BOOK_NAME_ALIASES[aiBook];
  if (canonical === contextBook) return true;

  // Prefix/suffix match for common variations:
  // e.g. "Psalm" starts with "Psalm" → matches "Psalms"
  if (
    contextBook.startsWith(aiBook) ||
    aiBook.startsWith(contextBook)
  ) {
    return true;
  }

  return false;
}

/**
 * Extract verse citations from the AI response text.
 *
 * Looks for patterns like "John 3:16", "Romans 8:28", "1 Corinthians 13:4-7",
 * and matches them against the context verses to pull full text.
 */
export function extractCitations(
  responseText: string,
  contextVerses: VerseSearchResult[]
): VerseCitation[] {
  // Match patterns like:
  //   "John 3:16"
  //   "1 Corinthians 13:4"
  //   "Genesis 1:1-3" (we take just the first verse in a range)
  const citationPattern =
    /(?:([123])?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*))\s+(\d+):(\d+)/g;

  const found = new Map<string, VerseCitation>();
  let match: RegExpExecArray | null;

  while ((match = citationPattern.exec(responseText)) !== null) {
    const [, prefix, bookName, chapterStr, verseStr] = match;
    const book = prefix ? `${prefix} ${bookName}` : bookName;
    const chapter = parseInt(chapterStr, 10);
    const verse = parseInt(verseStr, 10);

    // Find matching context verse (with fuzzy book name matching)
    const contextVerse = contextVerses.find(
      (v) => matchBook(book, v.book) && v.chapter === chapter && v.verse === verse
    );

    if (contextVerse) {
      // Use the canonical DB book name in the citation key
      const key = `${contextVerse.book}|${chapter}|${verse}`;
      if (!found.has(key)) {
        found.set(key, {
          book: contextVerse.book,
          chapter,
          verse,
          text: contextVerse.text,
        });
      }
    }
  }

  return Array.from(found.values());
}

// ── Fabrication Detection ──────────────────────────────────────────────────────

/**
 * Result of the fabrication check.
 */
export interface FabricationWarning {
  /** Whether any potential fabrication was detected. */
  detected: boolean;
  /** The suspect passages that don't match any context verse. */
  suspectPassages: string[];
}

/**
 * Minimum length for a quoted passage to be checked.
 * Shorter quotes are often common phrases, not fabricated verses.
 */
const MIN_QUOTE_LENGTH = 40;

/**
 * Check if the AI response contains quoted text that doesn't appear
 * in any of the provided context verses.
 *
 * This is a defense-in-depth guardrail. The system prompt already instructs
 * the model not to fabricate, but this catches it if it happens anyway.
 *
 * Strategy:
 *   1. Extract all double-quoted passages from the response
 *   2. For each passage over MIN_QUOTE_LENGTH chars, check if it appears
 *      as a substring of any context verse
 *   3. Flag any that don't match
 *
 * Note: This is a heuristic — short quotes and paraphrases won't be caught.
 * The primary safety mechanism is the system prompt grounding rules.
 */
export function detectFabrications(
  responseText: string,
  contextVerses: VerseSearchResult[]
): FabricationWarning {
  const suspectPassages: string[] = [];

  // Extract text between double quotes: "..." or "..."
  const quotePattern = /["“]([^"”]{10,}?)["”]/g;
  let match: RegExpExecArray | null;

  while ((match = quotePattern.exec(responseText)) !== null) {
    const quotedText = match[1].trim();

    // Skip short quotes — they're likely common phrases, not fabricated verses
    if (quotedText.length < MIN_QUOTE_LENGTH) continue;

    // Check if this quoted text appears in any context verse
    const found = contextVerses.some((v) => {
      // Normalize both strings for comparison: collapse whitespace, lowercase
      const normalizedVerse = v.text.replace(/\s+/g, " ").toLowerCase();
      const normalizedQuote = quotedText.replace(/\s+/g, " ").toLowerCase();
      return normalizedVerse.includes(normalizedQuote);
    });

    if (!found) {
      suspectPassages.push(quotedText);
    }
  }

  return {
    detected: suspectPassages.length > 0,
    suspectPassages,
  };
}

// ── Response Parsing ──────────────────────────────────────────────────────────

/**
 * Parse Claude's response, extract citations, and check for fabrications.
 */
export function parseResponse(
  rawResponse: string,
  contextVerses: VerseSearchResult[]
): { answer: string; citations: VerseCitation[]; fabricationWarning?: FabricationWarning } {
  const citations = extractCitations(rawResponse, contextVerses);
  const fabricationWarning = detectFabrications(rawResponse, contextVerses);

  return {
    answer: rawResponse.trim(),
    citations,
    ...(fabricationWarning.detected ? { fabricationWarning } : {}),
  };
}

// Re-export system prompt for direct use by API route
export { SYSTEM_PROMPT, buildPrompt, formatVerseContext };
