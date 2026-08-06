import { getPool } from "@xjoy/db";
import type { QueryResult } from "pg";

export interface Note {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export async function createNote(params: {
  book: string; chapter: number; verse: number; content: string;
}): Promise<Note> {
  const pool = getPool();
  const result: QueryResult<Note> = await pool.query(
    `INSERT INTO notes (book, chapter, verse, content)
     VALUES ($1, $2, $3, $4)
     RETURNING id, book, chapter, verse, content, created_at, updated_at`,
    [params.book, params.chapter, params.verse, params.content]
  );
  return result.rows[0];
}

export async function getNotes(
  limit: number = 50, offset: number = 0
): Promise<Note[]> {
  const pool = getPool();
  const result: QueryResult<Note> = await pool.query(
    `SELECT id, book, chapter, verse, content, created_at, updated_at
     FROM notes ORDER BY updated_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}

export async function getNote(id: number): Promise<Note | null> {
  const pool = getPool();
  const result: QueryResult<Note> = await pool.query(
    `SELECT id, book, chapter, verse, content, created_at, updated_at
     FROM notes WHERE id = $1`, [id]
  );
  return result.rows[0] ?? null;
}

export async function getNotesForVerse(
  book: string, chapter: number, verse: number
): Promise<Note[]> {
  const pool = getPool();
  const result: QueryResult<Note> = await pool.query(
    `SELECT id, book, chapter, verse, content, created_at, updated_at
     FROM notes WHERE book = $1 AND chapter = $2 AND verse = $3
     ORDER BY updated_at DESC`,
    [book, chapter, verse]
  );
  return result.rows;
}

export async function updateNote(params: {
  id: number; content: string;
}): Promise<Note | null> {
  const pool = getPool();
  const result: QueryResult<Note> = await pool.query(
    `UPDATE notes SET content = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, book, chapter, verse, content, created_at, updated_at`,
    [params.id, params.content]
  );
  return result.rows[0] ?? null;
}

export async function deleteNote(id: number): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(`DELETE FROM notes WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}
