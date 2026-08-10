/**
 * Study Scores DB helpers.
 *
 * Persists quiz/jigsaw results and tracks daily streaks.
 */

import { getPool } from "./db";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StudyScore {
  id: number;
  game_type: "quiz" | "jigsaw";
  score: number;
  total: number;
  accuracy: number | null;
  time_seconds: number | null;
  difficulty: string | null;
  book: string | null;
  chapter: number | null;
  details: unknown;
  created_at: string;
}

export interface StudyStats {
  quiz: {
    total_games: number;
    total_questions: number;
    correct_answers: number;
    accuracy: number;
    high_score: number;
  };
  jigsaw: {
    total_games: number;
    best_score: number;
    avg_accuracy: number;
    best_time: number;
  };
  streak: {
    current_days: number;
    longest_days: number;
    total_active_days: number;
  };
  chapters_completed: number;
}

// ── Score CRUD ─────────────────────────────────────────────────────────────────

/** Save a game result. Also upserts the streak record for today. */
export async function saveScore(params: {
  game_type: "quiz" | "jigsaw";
  score: number;
  total: number;
  accuracy?: number;
  time_seconds?: number;
  difficulty?: string;
  book?: string;
  chapter?: number;
  details?: unknown;
}): Promise<StudyScore> {
  const pool = getPool();
  const result = await pool.query<StudyScore>(
    `INSERT INTO study_scores (game_type, score, total, accuracy, time_seconds, difficulty, book, chapter, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      params.game_type,
      params.score,
      params.total,
      params.accuracy ?? null,
      params.time_seconds ?? null,
      params.difficulty ?? null,
      params.book ?? null,
      params.chapter ?? null,
      params.details ? JSON.stringify(params.details) : null,
    ]
  );

  // Upsert streak for today
  const today = new Date().toISOString().split("T")[0];
  const column = params.game_type === "quiz" ? "quiz_count" : "jigsaw_count";
  await pool.query(
    `INSERT INTO study_streaks (activity_date, quiz_count, jigsaw_count)
     VALUES ($1, $2, $3)
     ON CONFLICT (activity_date) DO UPDATE
       SET ${column} = study_streaks.${column} + 1`,
    [today, params.game_type === "quiz" ? 1 : 0, params.game_type === "jigsaw" ? 1 : 0]
  );

  return result.rows[0];
}

/** Get recent scores, optionally filtered by game_type. */
export async function getRecentScores(
  game_type?: "quiz" | "jigsaw",
  limit: number = 20
): Promise<StudyScore[]> {
  const pool = getPool();
  if (game_type) {
    const result = await pool.query<StudyScore>(
      `SELECT * FROM study_scores WHERE game_type = $1 ORDER BY created_at DESC LIMIT $2`,
      [game_type, limit]
    );
    return result.rows;
  }
  const result = await pool.query<StudyScore>(
    `SELECT * FROM study_scores ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

// ── Stats ──────────────────────────────────────────────────────────────────────

/** Compute aggregate study statistics. */
export async function getStudyStats(): Promise<StudyStats> {
  const pool = getPool();

  // Quiz stats
  const quizStats = await pool.query<{
    total_games: number;
    total_questions: number;
    correct_answers: number;
    accuracy: number;
    high_score: number;
  }>(
    `SELECT
       COUNT(*)::int AS total_games,
       COALESCE(SUM(total) / 10, 0)::int AS total_questions,
       COALESCE(SUM(score) / 10, 0)::int AS correct_answers,
       CASE WHEN COUNT(*) > 0 THEN ROUND(AVG(accuracy), 1) ELSE 0 END AS accuracy,
       COALESCE(MAX(score), 0) AS high_score
     FROM study_scores WHERE game_type = 'quiz'`
  );

  // Jigsaw stats
  const jigsawStats = await pool.query<{
    total_games: number;
    best_score: number;
    avg_accuracy: number;
    best_time: number;
  }>(
    `SELECT
       COUNT(*)::int AS total_games,
       COALESCE(MAX(score), 0) AS best_score,
       CASE WHEN COUNT(*) > 0 THEN ROUND(AVG(accuracy), 1) ELSE 0 END AS avg_accuracy,
       COALESCE(MIN(time_seconds), 0)::int AS best_time
     FROM study_scores WHERE game_type = 'jigsaw'`
  );

  // Streak calculation
  const streakResult = await pool.query<{ activity_date: string }>(
    `SELECT activity_date FROM study_streaks ORDER BY activity_date DESC`
  );
  const streak = computeStreak(streakResult.rows.map((r) => r.activity_date));

  // Chapters completed (distinct book+chapter combos in study_scores)
  const chaptersResult = await pool.query<{ count: number }>(
    `SELECT COUNT(DISTINCT (book, chapter))::int AS count
     FROM study_scores WHERE book IS NOT NULL AND chapter IS NOT NULL`
  );

  return {
    quiz: quizStats.rows[0],
    jigsaw: jigsawStats.rows[0],
    streak,
    chapters_completed: chaptersResult.rows[0]?.count ?? 0,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function computeStreak(dates: string[]): {
  current_days: number;
  longest_days: number;
  total_active_days: number;
} {
  if (dates.length === 0) return { current_days: 0, longest_days: 0, total_active_days: 0 };

  const unique = [...new Set(dates)].sort().reverse(); // newest first
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Current streak: count consecutive days backward from today (or yesterday)
  let currentDays = 0;
  const checkDate = unique[0] === today ? today : unique[0] === yesterday ? yesterday : null;
  if (checkDate) {
    let cursor = new Date(checkDate);
    for (const d of unique) {
      const expected = cursor.toISOString().split("T")[0];
      if (d === expected) {
        currentDays++;
        cursor = new Date(cursor.getTime() - 86400000);
      } else if (d < expected) {
        break;
      }
    }
  }

  // Longest streak
  let longestDays = 1;
  let run = 1;
  const sorted = [...new Set(dates)].sort(); // oldest first
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      run++;
      longestDays = Math.max(longestDays, run);
    } else {
      run = 1;
    }
  }

  return {
    current_days: currentDays,
    longest_days: Math.max(longestDays, currentDays),
    total_active_days: unique.length,
  };
}
