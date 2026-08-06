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
