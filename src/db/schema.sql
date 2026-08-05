-- Xjoy Database Schema
-- PostgreSQL with pgvector extension

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Bible verses table
CREATE TABLE IF NOT EXISTS verses (
    id              SERIAL PRIMARY KEY,
    book            VARCHAR(50)  NOT NULL,
    chapter         INTEGER      NOT NULL,
    verse           INTEGER      NOT NULL,
    text            TEXT         NOT NULL,
    embedding       vector(1536),             -- OpenAI/Claude embedding dimension
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(book, chapter, verse)
);

-- Index for verse lookup
CREATE INDEX IF NOT EXISTS idx_verses_reference
    ON verses (book, chapter, verse);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_verses_embedding
    ON verses USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

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
