/**
 * KJV Database Ingestion Script
 *
 * Reads data/kjv.json and loads all 31,102 verses into a SQLite database
 * (PostgreSQL when DATABASE_URL is set). Creates indexes for fast lookup.
 *
 * Usage:
 *   npx tsx scripts/ingest_kjv.ts              # SQLite (local dev)
 *   npx tsx scripts/ingest_kjv.ts --pg         # PostgreSQL (needs DATABASE_URL)
 *   npx tsx scripts/ingest_kjv.ts --lookup "John 3:16"  # Test verse lookup
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import Database from "better-sqlite3";

// ── Types ────────────────────────────────────────────────────────────────────

interface VerseRow {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

interface KJVData {
  meta: {
    source: string;
    fetchedAt: string;
    totalBooks: number;
    totalChapters: number;
    totalVerses: number;
  };
  verses: VerseRow[];
}

// ── SQLite Setup ─────────────────────────────────────────────────────────────

function openSQLite(): Database.Database {
  const dataDir = join(__dirname, "..", "data");
  const dbPath = join(dataDir, "kjv.db");
  console.log(`Opening SQLite database: ${dbPath}`);

  const db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  return db;
}

function createSQLiteSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS verses (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      book      TEXT    NOT NULL,
      chapter   INTEGER NOT NULL,
      verse     INTEGER NOT NULL,
      text      TEXT    NOT NULL,
      created_at TEXT   NOT NULL DEFAULT (datetime('now')),
      UNIQUE(book, chapter, verse)
    );

    CREATE INDEX IF NOT EXISTS idx_verses_reference
      ON verses (book, chapter, verse);

    CREATE INDEX IF NOT EXISTS idx_verses_book
      ON verses (book);

    -- Full-text search for verse content
    CREATE VIRTUAL TABLE IF NOT EXISTS verses_fts
      USING fts5(book, chapter, verse, text, content=verses, content_rowid=id);
  `);
}

function insertVersesSQLite(db: Database.Database, verses: VerseRow[]): void {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO verses (book, chapter, verse, text)
    VALUES (@book, @chapter, @verse, @text)
  `);

  const insertMany = db.transaction((rows: VerseRow[]) => {
    for (const row of rows) {
      insert.run(row);
    }
  });

  insertMany(verses);
}

/**
 * Rebuild the FTS index after inserting data.
 * This must be called after all inserts; the content-sync approach (content=verses)
 * handles incremental updates automatically, but for bulk load we rebuild.
 */
function rebuildFTS(db: Database.Database): void {
  db.exec("INSERT INTO verses_fts(verses_fts) VALUES('rebuild')");
}

// ── PostgreSQL Setup ─────────────────────────────────────────────────────────

async function insertVersesPG(verses: VerseRow[]): Promise<void> {
  const { Pool } = await import("pg");
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Use SQLite mode (omit --pg).");
  }

  const pool = new Pool({ connectionString: url, max: 5 });

  try {
    // Create table (idempotent)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verses (
        id        SERIAL PRIMARY KEY,
        book      VARCHAR(50)  NOT NULL,
        chapter   INTEGER      NOT NULL,
        verse     INTEGER      NOT NULL,
        text      TEXT         NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(book, chapter, verse)
      );
      CREATE INDEX IF NOT EXISTS idx_verses_reference
        ON verses (book, chapter, verse);
    `);

    // Batch insert using COPY-like approach via multi-row INSERT
    const BATCH = 1000;
    for (let i = 0; i < verses.length; i += BATCH) {
      const batch = verses.slice(i, i + BATCH);
      const values: string[] = [];
      const params: unknown[] = [];
      batch.forEach((v, j) => {
        const base = j * 4;
        values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
        params.push(v.book, v.chapter, v.verse, v.text);
      });

      await pool.query(
        `INSERT INTO verses (book, chapter, verse, text)
         VALUES ${values.join(", ")}
         ON CONFLICT (book, chapter, verse) DO NOTHING`,
        params
      );

      if ((i + BATCH) % 10000 === 0) {
        console.log(`  Inserted ${i + BATCH} verses...`);
      }
    }

    console.log(`  PostgreSQL: inserted ${verses.length} verses`);
  } finally {
    await pool.end();
  }
}

// ── Book Name Aliases (user-facing) ────────────────────────────────────────

/**
 * Map common user-facing book name variations to canonical names.
 * The database stores canonical names; this normalizes user input.
 */
const BOOK_ALIASES: Record<string, string> = {
  Psalm: "Psalms",
  "Song of Songs": "Song of Solomon",
  Sgs: "Song of Solomon",
  Eccl: "Ecclesiastes",
  // "1 John" etc. are already canonical
};

function normalizeLookupBook(name: string): string {
  return BOOK_ALIASES[name] ?? name;
}

// ── Verse Lookup ─────────────────────────────────────────────────────────────

function lookupVerse(db: Database.Database, reference: string): void {
  // Parse "Book Chapter:Verse" — e.g. "John 3:16", "1 Samuel 17:49"
  const match = reference.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!match) {
    console.log(`Invalid reference format: "${reference}". Use "Book Chapter:Verse".`);
    return;
  }

  const [, rawBook, chapter, verse] = match;
  const book = normalizeLookupBook(rawBook);
  const row = db
    .prepare(
      `SELECT book, chapter, verse, text FROM verses
       WHERE book = ? AND chapter = ? AND verse = ?`
    )
    .get(book, Number(chapter), Number(verse)) as VerseRow | undefined;

  if (row) {
    console.log(`\n${row.book} ${row.chapter}:${row.verse}`);
    console.log(`"${row.text}"`);
  } else {
    console.log(`Verse not found: ${reference}`);
  }
}

function searchVerses(db: Database.Database, query: string): void {
  const rows = db
    .prepare(
      `SELECT book, chapter, verse, text FROM verses_fts
       WHERE verses_fts MATCH ?
       ORDER BY rank
       LIMIT 10`
    )
    .all(query) as VerseRow[];

  if (rows.length === 0) {
    console.log(`No results for: "${query}"`);
    return;
  }

  console.log(`\n${rows.length} results for "${query}":\n`);
  for (const row of rows) {
    console.log(`  ${row.book} ${row.chapter}:${row.verse} — "${row.text}"`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // Parse flags
  const usePG = args.includes("--pg");
  const lookupRef = args.includes("--lookup") ? args[args.indexOf("--lookup") + 1] : null;
  const searchQuery = args.includes("--search") ? args[args.indexOf("--search") + 1] : null;

  console.log("╔══════════════════════════════════════════╗");
  console.log("║   Xjoy — KJV Database Ingestion         ║");
  console.log("╚══════════════════════════════════════════╝\n");

  // Read the JSON data
  const dataPath = join(__dirname, "..", "data", "kjv.json");
  if (!existsSync(dataPath)) {
    console.error(`Data file not found: ${dataPath}`);
    console.error("Run 'npx tsx scripts/fetch_kjv.ts' first.");
    process.exit(1);
  }

  const raw = readFileSync(dataPath, "utf-8");
  const data: KJVData = JSON.parse(raw);
  const { verses, meta } = data;

  console.log(`Loaded ${verses.length} verses from kjv.json`);
  console.log(`Source: ${meta.source} (fetched ${meta.fetchedAt})\n`);

  // If just doing a lookup/search, open DB read-only and return
  if (lookupRef || searchQuery) {
    const db = openSQLite();
    if (lookupRef) lookupVerse(db, lookupRef);
    if (searchQuery) searchVerses(db, searchQuery);
    db.close();
    return;
  }

  // Ingest
  if (usePG) {
    console.log("Ingesting to PostgreSQL...\n");
    await insertVersesPG(verses);
  } else {
    console.log("Ingesting to SQLite...\n");
    const db = openSQLite();

    console.log("Creating schema...");
    createSQLiteSchema(db);

    console.log("Inserting verses...");
    const start = performance.now();
    insertVersesSQLite(db, verses);
    const elapsed = ((performance.now() - start) / 1000).toFixed(2);

    console.log(`  Inserted ${verses.length} verses in ${elapsed}s`);

    console.log("Rebuilding FTS index...");
    rebuildFTS(db);

    // Verify
    const count = db.prepare("SELECT COUNT(*) as c FROM verses").get() as { c: number };
    console.log(`\nDatabase contains ${count.c} verses`);

    db.close();
  }

  console.log("\n✓ Ingestion complete.");
  console.log("  Lookup: npx tsx scripts/ingest_kjv.ts --lookup \"John 3:16\"");
  console.log("  Search: npx tsx scripts/ingest_kjv.ts --search \"living water\"");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
