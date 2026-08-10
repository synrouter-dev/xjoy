/**
 * @xjoy/db — Database layer
 *
 * Re-exports:
 * - db.ts: query functions (searchVerses, getVerse, conversations, etc.)
 * - config: DB configuration helpers (migrate, seed use these)
 */

// ── Database client configuration (used by migrate/seed scripts) ──

export interface DbConfig {
  connectionString: string;
  maxConnections?: number;
}

export function getDbConfig(): DbConfig {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return {
    connectionString: url,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || "10", 10),
  };
}

// ── Query functions ──

export {
  getPool,
  closePool,
  searchVerses,
  searchVersesBroad,
  getVerse,
  getChapter,
  getVerseRange,
  searchVersesByVector,
  getCrossRefsFrom,
  getCrossRefsTo,
  createConversation,
  getConversation,
  getConversations,
  updateConversationTitle,
  addMessage,
  getMessages,
  getDailyQuizCache,
  setDailyQuizCache,
  saveQuizAttempt,
  getTodayQuizAttempt,
  getJigsawProgress,
  awardJigsawPiece,
  type Conversation,
  type Message,
  type DailyQuizCache,
  type UserQuizAttempt,
  type JigsawProgress,
} from "./db";

// ── Study Scores ──

export {
  saveScore,
  getRecentScores,
  getStudyStats,
  type StudyScore,
  type StudyStats,
} from "./study-scores";

// Re-export shared types used in db.ts return types
export type { Verse, VerseSearchResult } from "@xjoy/shared";
