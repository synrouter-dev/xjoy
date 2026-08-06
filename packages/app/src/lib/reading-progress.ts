import { getPool } from "@xjoy/db";
import type { QueryResult } from "pg";

export interface ReadingRecord {
  id: number;
  book: string;
  chapter: number;
  read_at: string;
}

export interface ReadingStats {
  total_chapters_read: number;
  total_books_started: number;
  last_read_book: string | null;
  last_read_chapter: number | null;
  last_read_at: string | null;
}

export async function recordReading(params: {
  book: string; chapter: number;
}): Promise<ReadingRecord> {
  const pool = getPool();
  const result: QueryResult<ReadingRecord> = await pool.query(
    `INSERT INTO reading_progress (book, chapter)
     VALUES ($1, $2)
     ON CONFLICT (book, chapter) DO UPDATE SET read_at = NOW()
     RETURNING id, book, chapter, read_at`,
    [params.book, params.chapter]
  );
  return result.rows[0];
}

export async function getReadingHistory(
  limit: number = 50
): Promise<ReadingRecord[]> {
  const pool = getPool();
  const result: QueryResult<ReadingRecord> = await pool.query(
    `SELECT id, book, chapter, read_at
     FROM reading_progress ORDER BY read_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

export async function getReadingStats(): Promise<ReadingStats> {
  const pool = getPool();
  const result: QueryResult<ReadingStats> = await pool.query(
    `SELECT
       COUNT(*)::int AS total_chapters_read,
       COUNT(DISTINCT book)::int AS total_books_started,
       (SELECT book FROM reading_progress ORDER BY read_at DESC LIMIT 1) AS last_read_book,
       (SELECT chapter FROM reading_progress ORDER BY read_at DESC LIMIT 1) AS last_read_chapter,
       (SELECT read_at FROM reading_progress ORDER BY read_at DESC LIMIT 1) AS last_read_at
     FROM reading_progress`
  );
  return result.rows[0] ?? {
    total_chapters_read: 0,
    total_books_started: 0,
    last_read_book: null,
    last_read_chapter: null,
    last_read_at: null,
  };
}
