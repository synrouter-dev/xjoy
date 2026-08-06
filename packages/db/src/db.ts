/**
 * Database query helpers.
 *
 * Provides a singleton connection pool and typed query functions
 * for verses, conversations, and messages.
 */

import { Pool, type QueryResult } from "pg";
import type { Verse, VerseSearchResult, Citation, CrossRef } from "@xjoy/shared";

// ── Pool ──────────────────────────────────────────────────────────────────────

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    pool = new Pool({
      connectionString,
      max: parseInt(process.env.DB_MAX_CONNECTIONS || "10", 10),
    });

    pool.on("error", (err) => {
      console.error("Unexpected PostgreSQL pool error:", err);
    });
  }
  return pool;
}

/** Release the pool (for graceful shutdown in tests/scripts). */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[] | null;
  created_at: string;
}

// ── Verse Queries ─────────────────────────────────────────────────────────────

export async function searchVerses(
  query: string,
  limit: number = 10
): Promise<VerseSearchResult[]> {
  const p = getPool();
  const result: QueryResult<VerseSearchResult> = await p.query(
    `SELECT id, book, chapter, verse, text,
       ts_rank(search_text, plainto_tsquery('english', $1)) AS rank
     FROM verses
     WHERE search_text @@ plainto_tsquery('english', $1)
     ORDER BY rank DESC
     LIMIT $2`,
    [query, limit]
  );
  return result.rows;
}

export async function searchVersesBroad(
  query: string,
  limit: number = 10
): Promise<VerseSearchResult[]> {
  const p = getPool();
  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2)
    .map((t) => `'${t}'`)
    .join(" | ");

  if (!terms) {
    return searchVerses(query, limit);
  }

  const result: QueryResult<VerseSearchResult> = await p.query(
    `SELECT id, book, chapter, verse, text,
       ts_rank(search_text, to_tsquery('english', $1)) AS rank
     FROM verses
     WHERE search_text @@ to_tsquery('english', $1)
     ORDER BY rank DESC
     LIMIT $2`,
    [terms, limit]
  );
  return result.rows;
}

export async function getVerse(
  book: string,
  chapter: number,
  verse: number
): Promise<Verse | null> {
  const p = getPool();
  const result: QueryResult<Verse> = await p.query(
    `SELECT id, book, chapter, verse, text
     FROM verses WHERE book = $1 AND chapter = $2 AND verse = $3 LIMIT 1`,
    [book, chapter, verse]
  );
  return result.rows[0] ?? null;
}

export async function getChapter(book: string, chapter: number): Promise<Verse[]> {
  const p = getPool();
  const result: QueryResult<Verse> = await p.query(
    `SELECT id, book, chapter, verse, text
     FROM verses WHERE book = $1 AND chapter = $2 ORDER BY verse`,
    [book, chapter]
  );
  return result.rows;
}

export async function getVerseRange(
  book: string, chapter: number, startVerse: number, endVerse: number
): Promise<Verse[]> {
  const p = getPool();
  const result: QueryResult<Verse> = await p.query(
    `SELECT id, book, chapter, verse, text
     FROM verses WHERE book = $1 AND chapter = $2
       AND verse >= $3 AND verse <= $4 ORDER BY verse`,
    [book, chapter, startVerse, endVerse]
  );
  return result.rows;
}

export async function searchVersesByVector(
  embedding: number[], limit: number = 10
): Promise<VerseSearchResult[]> {
  const p = getPool();
  const vectorStr = `[${embedding.join(",")}]`;
  try {
    const result: QueryResult<VerseSearchResult> = await p.query(
      `SELECT id, book, chapter, verse, text,
         1 - (embedding <=> $1::vector) AS rank
       FROM verses WHERE embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector LIMIT $2`,
      [vectorStr, limit]
    );
    return result.rows;
  } catch (err) {
    console.warn("Vector search unavailable:", err);
    return [];
  }
}

// ── Cross-Reference Queries ──────────────────────────────────────────────────

export async function getCrossRefsFrom(
  book: string, chapter: number, verse: number, limit: number = 30
): Promise<CrossRef[]> {
  const p = getPool();
  const result: QueryResult<CrossRef> = await p.query(
    `SELECT from_book, from_chapter, from_verse,
            to_book, to_chapter, to_verse_start, to_verse_end, votes
     FROM cross_references
     WHERE from_book = $1 AND from_chapter = $2 AND from_verse = $3
     ORDER BY votes DESC LIMIT $4`,
    [book, chapter, verse, limit]
  );
  return result.rows;
}

export async function getCrossRefsTo(
  book: string, chapter: number, verse: number, limit: number = 20
): Promise<CrossRef[]> {
  const p = getPool();
  const result: QueryResult<CrossRef> = await p.query(
    `SELECT from_book, from_chapter, from_verse,
            to_book, to_chapter, to_verse_start, to_verse_end, votes
     FROM cross_references
     WHERE to_book = $1 AND to_chapter = $2
       AND to_verse_start <= $3 AND to_verse_end >= $3
     ORDER BY votes DESC LIMIT $4`,
    [book, chapter, verse, limit]
  );
  return result.rows;
}

// ── Conversation Queries ──────────────────────────────────────────────────────

export async function createConversation(title?: string): Promise<Conversation> {
  const p = getPool();
  const result: QueryResult<Conversation> = await p.query(
    `INSERT INTO conversations (title) VALUES ($1)
     RETURNING id, title, created_at, updated_at`,
    [title ?? null]
  );
  return result.rows[0];
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const p = getPool();
  const result: QueryResult<Conversation> = await p.query(
    `SELECT id, title, created_at, updated_at
     FROM conversations WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function getConversations(limit: number = 20): Promise<Conversation[]> {
  const p = getPool();
  const result: QueryResult<Conversation> = await p.query(
    `SELECT id, title, created_at, updated_at
     FROM conversations ORDER BY updated_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  const p = getPool();
  await p.query(
    `UPDATE conversations SET title = $2, updated_at = NOW() WHERE id = $1`,
    [id, title]
  );
}

// ── Message Queries ───────────────────────────────────────────────────────────

export async function addMessage(
  conversationId: string, role: "user" | "assistant",
  content: string, citations?: Citation[]
): Promise<Message> {
  const p = getPool();
  const result: QueryResult<Message> = await p.query(
    `INSERT INTO messages (conversation_id, role, content, citations)
     VALUES ($1, $2, $3, $4)
     RETURNING id, conversation_id, role, content, citations, created_at`,
    [conversationId, role, content, citations ? JSON.stringify(citations) : null]
  );
  await p.query(
    `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
    [conversationId]
  );
  return result.rows[0];
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const p = getPool();
  const result: QueryResult<Message> = await p.query(
    `SELECT id, conversation_id, role, content, citations, created_at
     FROM messages WHERE conversation_id = $1 ORDER BY created_at`,
    [conversationId]
  );
  return result.rows;
}
