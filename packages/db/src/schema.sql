-- Xjoy Database Schema
-- PostgreSQL with pgvector extension

-- Enable pgvector extension (skipped if unavailable, e.g. local dev without pgvector)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pgvector extension not available — skipping (embedding column will be omitted)';
END
$$;

-- Bible verses table
-- embedding column is added conditionally: included when pgvector is available, omitted otherwise
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
    ) THEN
        CREATE TABLE IF NOT EXISTS verses (
            id              SERIAL PRIMARY KEY,
            book            VARCHAR(50)  NOT NULL,
            chapter         INTEGER      NOT NULL,
            verse           INTEGER      NOT NULL,
            text            TEXT         NOT NULL,
            search_text     TSVECTOR,
            embedding       vector(1536),
            created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            UNIQUE(book, chapter, verse)
        );
    ELSE
        CREATE TABLE IF NOT EXISTS verses (
            id              SERIAL PRIMARY KEY,
            book            VARCHAR(50)  NOT NULL,
            chapter         INTEGER      NOT NULL,
            verse           INTEGER      NOT NULL,
            text            TEXT         NOT NULL,
            search_text     TSVECTOR,
            created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            UNIQUE(book, chapter, verse)
        );
    END IF;
END
$$;

-- Index for verse lookup
CREATE INDEX IF NOT EXISTS idx_verses_reference
    ON verses (book, chapter, verse);

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_verses_search
    ON verses USING GIN (search_text);

-- Index for vector similarity search (created after data is loaded)
-- CREATE INDEX IF NOT EXISTS idx_verses_embedding
--     ON verses USING ivfflat (embedding vector_cosine_ops)
--     WITH (lists = 100);

-- Chat conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID         NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role            VARCHAR(20)  NOT NULL CHECK (role IN ('user', 'assistant')),
    content         TEXT         NOT NULL,
    citations       JSONB,                    -- Array of {book, chapter, verse, text} references
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages (conversation_id, created_at);

-- Cross-references table (Treasury of Scripture Knowledge)
-- Stores verse-to-verse reference links with vote counts.
CREATE TABLE IF NOT EXISTS cross_references (
    id              SERIAL PRIMARY KEY,
    from_book       VARCHAR(50)  NOT NULL,
    from_chapter    INTEGER      NOT NULL,
    from_verse      INTEGER      NOT NULL,
    to_book         VARCHAR(50)  NOT NULL,
    to_chapter      INTEGER      NOT NULL,
    to_verse_start  INTEGER      NOT NULL,
    to_verse_end    INTEGER      NOT NULL,
    votes           INTEGER      NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_crossref_from
    ON cross_references (from_book, from_chapter, from_verse);

CREATE INDEX IF NOT EXISTS idx_crossref_to
    ON cross_references (to_book, to_chapter, to_verse_start);

-- User feedback table
-- Collects structured feedback during the initial user testing phase.
-- Categories: ai_accuracy, reading_experience, overall_impression, feature_request, bug
CREATE TABLE IF NOT EXISTS feedback (
    id              SERIAL PRIMARY KEY,
    category        VARCHAR(50)  NOT NULL CHECK (category IN (
                        'ai_accuracy', 'reading_experience', 'overall_impression',
                        'feature_request', 'bug'
                    )),
    rating          INTEGER      CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
    comment         TEXT         NOT NULL,
    email           VARCHAR(255),
    user_agent      TEXT,
    page_url        VARCHAR(500),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_category
    ON feedback (category);

CREATE INDEX IF NOT EXISTS idx_feedback_created
    ON feedback (created_at DESC);

-- ── Bookmarks table ────────────────────────────────────────────────────────────
-- Stores user bookmarks with verse references.
-- UNIQUE(book, chapter, verse) ensures one bookmark per verse.
CREATE TABLE IF NOT EXISTS bookmarks (
    id              SERIAL PRIMARY KEY,
    book            VARCHAR(50)  NOT NULL,
    chapter         INTEGER      NOT NULL,
    verse           INTEGER      NOT NULL,
    note            TEXT,                       -- optional user note on bookmark
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(book, chapter, verse)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_ref
    ON bookmarks (book, chapter, verse);

CREATE INDEX IF NOT EXISTS idx_bookmarks_created
    ON bookmarks (created_at DESC);

-- ── Notes table ────────────────────────────────────────────────────────────────
-- Rich-text notes linked to specific verse references.
CREATE TABLE IF NOT EXISTS notes (
    id              SERIAL PRIMARY KEY,
    book            VARCHAR(50)  NOT NULL,
    chapter         INTEGER      NOT NULL,
    verse           INTEGER      NOT NULL,
    content         TEXT         NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_ref
    ON notes (book, chapter, verse);

CREATE INDEX IF NOT EXISTS idx_notes_created
    ON notes (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notes_updated
    ON notes (updated_at DESC);

-- ── Reading Progress table ─────────────────────────────────────────────────────
-- Tracks which chapters the user has read, with timestamps.
CREATE TABLE IF NOT EXISTS reading_progress (
    id              SERIAL PRIMARY KEY,
    book            VARCHAR(50)  NOT NULL,
    chapter         INTEGER      NOT NULL,
    read_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(book, chapter)
);

CREATE INDEX IF NOT EXISTS idx_reading_progress_book
    ON reading_progress (book, chapter);

CREATE INDEX IF NOT EXISTS idx_reading_progress_read_at
    ON reading_progress (read_at DESC);

-- ── Study Scores table ──────────────────────────────────────────────────────────
-- Persists quiz and jigsaw game results for the scoring/streak system.
CREATE TABLE IF NOT EXISTS study_scores (
    id              SERIAL PRIMARY KEY,
    game_type       VARCHAR(20)  NOT NULL CHECK (game_type IN ('quiz', 'jigsaw')),
    score           INTEGER      NOT NULL,
    total           INTEGER      NOT NULL,
    accuracy        NUMERIC(5,2),
    time_seconds    INTEGER,
    difficulty      VARCHAR(20),
    book            VARCHAR(50),
    chapter         INTEGER,
    details         JSONB,                         -- per-question results or piece positions
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_scores_type_created
    ON study_scores (game_type, created_at DESC);

-- ── Study Streaks table ──────────────────────────────────────────────────────────
-- Tracks daily study activity for consecutive-day streak calculation.
-- One row per day the user completes any study activity.
CREATE TABLE IF NOT EXISTS study_streaks (
    id              SERIAL PRIMARY KEY,
    activity_date   DATE         NOT NULL UNIQUE,
    quiz_count      INTEGER      NOT NULL DEFAULT 0,
    jigsaw_count    INTEGER      NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_streaks_date
    ON study_streaks (activity_date DESC);

-- ── Daily Quiz Cache ────────────────────────────────────────────────────────
-- Stores pre-generated daily quiz questions. One row per date.
-- Questions are generated by Claude API (primary) or local fallback.
CREATE TABLE IF NOT EXISTS daily_quiz_cache (
    id              SERIAL PRIMARY KEY,
    quiz_date       DATE         NOT NULL UNIQUE,
    questions       JSONB        NOT NULL,  -- Array of QuizQuestion objects
    generated_by    VARCHAR(20)  NOT NULL DEFAULT 'local',  -- 'claude' | 'local'
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_quiz_date
    ON daily_quiz_cache (quiz_date);

-- ── User Quiz Attempts ──────────────────────────────────────────────────────
-- Records each daily quiz attempt.
-- One row per attempt (user may retry same day's quiz).
CREATE TABLE IF NOT EXISTS user_quiz_attempts (
    id              SERIAL PRIMARY KEY,
    quiz_date       DATE         NOT NULL,
    score           INTEGER      NOT NULL,
    total           INTEGER      NOT NULL,
    correct_count   INTEGER      NOT NULL,
    answers         JSONB        NOT NULL,  -- Array of {questionId, selectedAnswer, correct}
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_date
    ON user_quiz_attempts (quiz_date, created_at DESC);

-- ── Weekly Jigsaw Progress ──────────────────────────────────────────────────
-- Tracks puzzle pieces earned. One piece per day of the week.
-- A piece is earned when user scores ≥ 3/5 on the daily quiz.
-- Collect all 7 pieces to complete the weekly jigsaw.
CREATE TABLE IF NOT EXISTS weekly_jigsaw_progress (
    id              SERIAL PRIMARY KEY,
    year            INTEGER      NOT NULL,
    week            INTEGER      NOT NULL,
    piece_day       INTEGER      NOT NULL CHECK (piece_day BETWEEN 0 AND 6),  -- 0=Sun, 6=Sat
    earned_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(year, week, piece_day)
);

CREATE INDEX IF NOT EXISTS idx_jigsaw_week
    ON weekly_jigsaw_progress (year, week);
