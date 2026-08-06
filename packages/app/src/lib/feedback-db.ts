/**
 * Feedback database helpers.
 *
 * Provides functions to insert and query user feedback during
 * the initial user testing phase (XJO-7).
 */

import { Pool, type QueryResult } from "pg";
import type {
  FeedbackCategory,
  FeedbackSubmission,
  FeedbackRecord,
} from "./feedback-types";

// ── Pool ────────────────────────────────────────────────────────────────────────

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    pool = new Pool({
      connectionString,
      max: 3,
    });
  }
  return pool;
}

// ── Queries ─────────────────────────────────────────────────────────────────────

/**
 * Insert a single feedback submission.
 */
export async function insertFeedback(
  submission: FeedbackSubmission,
  userAgent?: string | null
): Promise<FeedbackRecord> {
  const p = getPool();
  const result: QueryResult<FeedbackRecord> = await p.query(
    `INSERT INTO feedback (category, rating, comment, email, user_agent, page_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, category, rating, comment, email, user_agent AS "userAgent",
               page_url AS "pageUrl", created_at AS "createdAt"`,
    [
      submission.category,
      submission.rating ?? null,
      submission.comment,
      submission.email ?? null,
      userAgent ?? null,
      submission.pageUrl ?? null,
    ]
  );
  return result.rows[0];
}

/**
 * Get all feedback, optionally filtered by category.
 * Ordered newest first.
 */
export async function getFeedback(
  category?: FeedbackCategory,
  limit: number = 100
): Promise<FeedbackRecord[]> {
  const p = getPool();
  if (category) {
    const result: QueryResult<FeedbackRecord> = await p.query(
      `SELECT id, category, rating, comment, email,
              user_agent AS "userAgent", page_url AS "pageUrl",
              created_at AS "createdAt"
       FROM feedback
       WHERE category = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [category, limit]
    );
    return result.rows;
  }

  const result: QueryResult<FeedbackRecord> = await p.query(
    `SELECT id, category, rating, comment, email,
            user_agent AS "userAgent", page_url AS "pageUrl",
            created_at AS "createdAt"
     FROM feedback
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

/**
 * Get feedback summary grouped by category with counts and average ratings.
 */
export async function getFeedbackSummary(): Promise<
  {
    category: FeedbackCategory;
    count: number;
    avgRating: number | null;
  }[]
> {
  const p = getPool();
  const result = await p.query(
    `SELECT
       category,
       COUNT(*)::int AS count,
       ROUND(AVG(rating)::numeric, 1) AS "avgRating"
     FROM feedback
     WHERE rating IS NOT NULL
     GROUP BY category
     ORDER BY category`
  );
  return result.rows;
}
