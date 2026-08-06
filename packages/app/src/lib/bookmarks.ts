import { getPool } from "@xjoy/db";
import type { QueryResult } from "pg";

export interface Bookmark {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  note: string | null;
  created_at: string;
}

export async function addBookmark(params: {
  book: string;
  chapter: number;
  verse: number;
  note?: string;
}): Promise<Bookmark> {
  const pool = getPool();
  const result: QueryResult<Bookmark> = await pool.query(
    `INSERT INTO bookmarks (book, chapter, verse, note)
     VALUES ($1, $2, $3, $4)
     RETURNING id, book, chapter, verse, note, created_at`,
    [params.book, params.chapter, params.verse, params.note ?? null]
  );
  return result.rows[0];
}

export async function getBookmarks(
  limit: number = 50, offset: number = 0
): Promise<Bookmark[]> {
  const pool = getPool();
  const result: QueryResult<Bookmark> = await pool.query(
    `SELECT id, book, chapter, verse, note, created_at
     FROM bookmarks ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}

export async function removeBookmark(id: number): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    `DELETE FROM bookmarks WHERE id = $1`, [id]
  );
  return (result.rowCount ?? 0) > 0;
}
