/**
 * Cross-Reference Ingestion Script
 *
 * Downloads the Treasury of Scripture Knowledge (TSK) cross-reference data
 * from the scrollmapper/bible_databases repository and loads it into SQLite
 * (or PostgreSQL when --pg is set).
 *
 * The TSK contains ~340,000 verse-to-verse cross-references with community
 * votes for relevance. We filter for positive votes to keep quality references.
 *
 * Usage:
 *   npx tsx scripts/fetch_crossrefs.ts                    # SQLite (local dev)
 *   npx tsx scripts/fetch_crossrefs.ts --pg               # PostgreSQL
 *   npx tsx scripts/fetch_crossrefs.ts --lookup "John 3:16"  # Look up refs for a verse
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import Database from "better-sqlite3";

// ── Types ────────────────────────────────────────────────────────────────────

interface CrossRef {
  from_book: string;
  from_chapter: number;
  from_verse: number;
  to_book: string;
  to_chapter: number;
  to_verse_start: number;
  to_verse_end: number;
  votes: number;
}

// ── Configuration ────────────────────────────────────────────────────────────

const BASE_URL =
  "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/sql/extras";
const NUM_FILES = 7;
const MIN_VOTES = 1; // Only keep references with positive community votes

// ── SQLite Setup ─────────────────────────────────────────────────────────────

function openSQLite(): Database.Database {
  const dataDir = join(__dirname, "..", "data");
  const dbPath = join(dataDir, "kjv.db");
  return new Database(dbPath);
}

function createCrossRefTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cross_references (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      from_book     TEXT    NOT NULL,
      from_chapter  INTEGER NOT NULL,
      from_verse    INTEGER NOT NULL,
      to_book       TEXT    NOT NULL,
      to_chapter    INTEGER NOT NULL,
      to_verse_start INTEGER NOT NULL,
      to_verse_end  INTEGER NOT NULL,
      votes         INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_crossref_from
      ON cross_references (from_book, from_chapter, from_verse);

    CREATE INDEX IF NOT EXISTS idx_crossref_to
      ON cross_references (to_book, to_chapter, to_verse_start);
  `);
}

function insertCrossRefsSQLite(db: Database.Database, refs: CrossRef[]): void {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO cross_references
      (from_book, from_chapter, from_verse, to_book, to_chapter, to_verse_start, to_verse_end, votes)
    VALUES
      (@from_book, @from_chapter, @from_verse, @to_book, @to_chapter, @to_verse_start, @to_verse_end, @votes)
  `);

  const insertMany = db.transaction((rows: CrossRef[]) => {
    for (const row of rows) {
      insert.run(row);
    }
  });

  insertMany(refs);
}

// ── Download & Parse ─────────────────────────────────────────────────────────

/**
 * Parse a SQL INSERT line into a CrossRef object.
 *
 * Example input:
 *   INSERT INTO `cross_references` (...) VALUES ('Genesis', 1, 1, 'Proverbs', 8, 22, 22, 59);
 */
function parseInsertLine(line: string): CrossRef | null {
  const match = line.match(
    /VALUES\s*\(\s*'([^']+)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'([^']+)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(-?\d+)\s*\)/
  );
  if (!match) return null;

  return {
    from_book: match[1],
    from_chapter: parseInt(match[2], 10),
    from_verse: parseInt(match[3], 10),
    to_book: match[4],
    to_chapter: parseInt(match[5], 10),
    to_verse_start: parseInt(match[6], 10),
    to_verse_end: parseInt(match[7], 10),
    votes: parseInt(match[8], 10),
  };
}

async function downloadAndParse(): Promise<CrossRef[]> {
  const allRefs: CrossRef[] = [];
  const dataDir = join(__dirname, "..", "data");
  const cacheDir = join(dataDir, "crossrefs_cache");

  // Ensure cache directory exists
  const { mkdirSync } = await import("fs");
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }

  for (let i = 0; i < NUM_FILES; i++) {
    const cachePath = join(cacheDir, `cross_references_${i}.sql`);
    let sql: string;

    if (existsSync(cachePath)) {
      console.log(`  Using cached cross_references_${i}.sql`);
      sql = readFileSync(cachePath, "utf-8");
    } else {
      const url = `${BASE_URL}/cross_references_${i}.sql`;
      console.log(`  Downloading ${url}...`);
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`  Failed to download ${i}: HTTP ${res.status}`);
        continue;
      }
      sql = await res.text();
      writeFileSync(cachePath, sql, "utf-8");
      console.log(`  Cached to ${cachePath}`);
    }

    // Parse VALUES lines (each INSERT spans two lines: INSERT INTO + VALUES)
    const lines = sql.split("\n");
    let parsed = 0;
    let skipped = 0;

    for (const line of lines) {
      if (!line.includes("VALUES")) continue;
      const ref = parseInsertLine(line);
      if (ref) {
        if (ref.votes >= MIN_VOTES) {
          allRefs.push(ref);
          parsed++;
        } else {
          skipped++;
        }
      }
    }

    console.log(`  File ${i}: ${parsed} references (${skipped} skipped due to low votes)`);
  }

  return allRefs;
}

// ── PostgreSQL ───────────────────────────────────────────────────────────────

async function insertCrossRefsPG(refs: CrossRef[]): Promise<void> {
  const { Pool } = await import("pg");
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Use SQLite mode (omit --pg).");
  }

  const pool = new Pool({ connectionString: url, max: 5 });

  try {
    // Create table (idempotent)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cross_references (
        id             SERIAL PRIMARY KEY,
        from_book      VARCHAR(50)  NOT NULL,
        from_chapter   INTEGER      NOT NULL,
        from_verse     INTEGER      NOT NULL,
        to_book        VARCHAR(50)  NOT NULL,
        to_chapter     INTEGER      NOT NULL,
        to_verse_start INTEGER      NOT NULL,
        to_verse_end   INTEGER      NOT NULL,
        votes          INTEGER      NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_crossref_from
        ON cross_references (from_book, from_chapter, from_verse);
      CREATE INDEX IF NOT EXISTS idx_crossref_to
        ON cross_references (to_book, to_chapter, to_verse_start);
    `);

    // Batch insert
    const BATCH = 1000;
    for (let i = 0; i < refs.length; i += BATCH) {
      const batch = refs.slice(i, i + BATCH);
      const values: string[] = [];
      const params: unknown[] = [];

      batch.forEach((r, j) => {
        const base = j * 8;
        values.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`
        );
        params.push(
          r.from_book, r.from_chapter, r.from_verse,
          r.to_book, r.to_chapter, r.to_verse_start, r.to_verse_end, r.votes
        );
      });

      await pool.query(
        `INSERT INTO cross_references
           (from_book, from_chapter, from_verse, to_book, to_chapter, to_verse_start, to_verse_end, votes)
         VALUES ${values.join(", ")}
         ON CONFLICT DO NOTHING`,
        params
      );

      if ((i + BATCH) % 10000 === 0) {
        console.log(`  Inserted ${i + BATCH} references...`);
      }
    }

    console.log(`  PostgreSQL: inserted ${refs.length} references`);
  } finally {
    await pool.end();
  }
}

// ── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Look up cross-references for a given verse and print them.
 */
function lookupCrossRefs(db: Database.Database, reference: string): void {
  const match = reference.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!match) {
    console.log(`Invalid reference format: "${reference}". Use "Book Chapter:Verse".`);
    return;
  }

  const [, book, chapter, verse] = match;

  // References FROM this verse
  const fromRefs = db
    .prepare(
      `SELECT to_book, to_chapter, to_verse_start, to_verse_end, votes
       FROM cross_references
       WHERE from_book = ? AND from_chapter = ? AND from_verse = ?
       ORDER BY votes DESC
       LIMIT 30`
    )
    .all(book, Number(chapter), Number(verse)) as CrossRef[];

  // References TO this verse
  const toRefs = db
    .prepare(
      `SELECT from_book, from_chapter, from_verse, votes
       FROM cross_references
       WHERE to_book = ? AND to_chapter = ? AND to_verse_start <= ? AND to_verse_end >= ?
       ORDER BY votes DESC
       LIMIT 20`
    )
    .all(book, Number(chapter), Number(verse), Number(verse)) as CrossRef[];

  console.log(`\nCross-references for ${book} ${chapter}:${verse}:`);
  console.log(`\n  References FROM this verse (${fromRefs.length}):`);
  for (const r of fromRefs.slice(0, 10)) {
    const ref = r.to_verse_start === r.to_verse_end
      ? `${r.to_book} ${r.to_chapter}:${r.to_verse_start}`
      : `${r.to_book} ${r.to_chapter}:${r.to_verse_start}-${r.to_verse_end}`;
    console.log(`    → ${ref}  (votes: ${r.votes})`);
  }

  console.log(`\n  References TO this verse (${toRefs.length}):`);
  for (const r of toRefs.slice(0, 10)) {
    console.log(`    ← ${r.from_book} ${r.from_chapter}:${r.from_verse}  (votes: ${r.votes})`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const usePG = args.includes("--pg");
  const lookupRef = args.includes("--lookup")
    ? args[args.indexOf("--lookup") + 1]
    : null;

  console.log("╔══════════════════════════════════════════╗");
  console.log("║   Xjoy — TSK Cross-Reference Ingestion  ║");
  console.log("╚══════════════════════════════════════════╝\n");

  // If just doing a lookup
  if (lookupRef) {
    const db = openSQLite();
    lookupCrossRefs(db, lookupRef);
    db.close();
    return;
  }

  // Download and parse
  console.log("Downloading and parsing cross-reference data...\n");
  const refs = await downloadAndParse();
  console.log(`\nTotal: ${refs.length} cross-references with votes >= ${MIN_VOTES}`);

  // Ingest
  if (usePG) {
    console.log("\nIngesting to PostgreSQL...");
    await insertCrossRefsPG(refs);
  } else {
    console.log("\nIngesting to SQLite...");
    const db = openSQLite();

    console.log("Creating table...");
    createCrossRefTable(db);

    console.log("Inserting references...");
    const start = performance.now();
    insertCrossRefsSQLite(db, refs);
    const elapsed = ((performance.now() - start) / 1000).toFixed(2);
    console.log(`  Inserted ${refs.length} references in ${elapsed}s`);

    // Verify
    const count = db
      .prepare("SELECT COUNT(*) as c FROM cross_references")
      .get() as { c: number };
    console.log(`\nDatabase contains ${count.c} cross-references`);

    db.close();
  }

  console.log("\n✓ Cross-reference ingestion complete.");
  console.log("  Lookup: npx tsx scripts/fetch_crossrefs.ts --lookup \"John 3:16\"");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
