/**
 * Database seeder.
 * Usage: npm run db:seed
 *
 * Reads data/kjv.json and populates the verses table with KJV text.
 * Builds full-text search vectors and validates data integrity.
 *
 * Idempotent — uses ON CONFLICT to skip already-seeded verses.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { Pool } from "pg";
import { getDbConfig } from "./index";

interface KJVVerse {
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
  verses: KJVVerse[];
}

const BATCH_SIZE = 500;

async function main() {
  const { connectionString } = getDbConfig();
  const pool = new Pool({ connectionString, max: 3 });

  try {
    // ── 1. Load KJV data ──────────────────────────────────────────────────────
    const dataPath = join(__dirname, "..", "..", "data", "kjv.json");
    if (!existsSync(dataPath)) {
      console.error(
        "data/kjv.json not found. Run 'npx tsx scripts/fetch_kjv.ts' first to download the KJV text."
      );
      process.exit(1);
    }

    console.log("Reading KJV data...");
    const raw = readFileSync(dataPath, "utf-8");
    const data: KJVData = JSON.parse(raw);

    console.log(
      `Loaded ${data.verses.length} verses from ${data.meta.totalBooks} books.`
    );

    // ── 2. Insert verses in batches ───────────────────────────────────────────
    console.log("Seeding verses table (this may take a moment)...");

    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < data.verses.length; i += BATCH_SIZE) {
      const batch = data.verses.slice(i, i + BATCH_SIZE);

      // Build a multi-row INSERT with ON CONFLICT to be idempotent
      const values: string[] = [];
      const params: (string | number)[] = [];
      let paramIdx = 1;

      for (const v of batch) {
        // Sanitize: escape single quotes in text
        values.push(
          `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, ` +
            `to_tsvector('english', $${paramIdx + 3}))`
        );
        params.push(v.book, v.chapter, v.verse, v.text);
        paramIdx += 4;
      }

      const query = `
        INSERT INTO verses (book, chapter, verse, text, search_text)
        VALUES ${values.join(", ")}
        ON CONFLICT (book, chapter, verse) DO NOTHING
      `;

      const result = await pool.query(query, params);
      inserted += result.rowCount ?? 0;
      skipped += batch.length - (result.rowCount ?? 0);

      // Progress indicator
      const pct = Math.round(((i + batch.length) / data.verses.length) * 100);
      process.stdout.write(
        `\r  ${pct}% — ${inserted} inserted, ${skipped} skipped`
      );
    }

    console.log(
      `\n✓ Seeded ${inserted} verses (${skipped} already present).`
    );

    // ── 3. Validate ───────────────────────────────────────────────────────────
    const { rows: countRows } = await pool.query(
      "SELECT COUNT(*) as count FROM verses"
    );
    const dbCount = parseInt(countRows[0].count, 10);
    console.log(`Verses in database: ${dbCount}`);

    if (dbCount < 31000) {
      console.warn(
        `⚠ Only ${dbCount} verses in database (expected ~31,102). ` +
          `If this is a fresh seed, re-fetch the KJV data with 'npx tsx scripts/fetch_kjv.ts'.`
      );
    }

    // ── 4. Update table statistics ────────────────────────────────────────────
    console.log("Updating query planner statistics...");
    await pool.query("ANALYZE verses");
    console.log("✓ Statistics updated.");

    console.log("\nSeed complete. The database is ready for AI chat queries.");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
