/**
 * Embedding Generation Script
 *
 * Generates OpenAI text-embedding-3-small embeddings for all KJV verses
 * and stores them in PostgreSQL with pgvector.
 *
 * The schema uses vector(1536) which matches the output of
 * text-embedding-3-small (and text-embedding-ada-002).
 *
 * Cost: text-embedding-3-small is ~$0.02/1M tokens.
 * The KJV has ~800K words, so this costs roughly $0.02 total.
 *
 * Usage:
 *   npx tsx scripts/generate_embeddings.ts              # all verses
 *   npx tsx scripts/generate_embeddings.ts --limit 100  # test with 100 verses
 *   npx tsx scripts/generate_embeddings.ts --book John  # single book
 */

import { readFileSync } from "fs";
import { join } from "path";
import OpenAI from "openai";

// ── Types ──────────────────────────────────────────────────────────────────────

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

// ── Config ─────────────────────────────────────────────────────────────────────

const MODEL = "text-embedding-3-small";
const DIMENSIONS = 1536;
const BATCH_SIZE = 100; // OpenAI allows up to 2048, but 100 is safer for memory
const DELAY_MS = 200; // Rate-limit safety: pause between batches

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // Parse flags
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : null;

  const bookIdx = args.indexOf("--book");
  const filterBook = bookIdx !== -1 ? args[bookIdx + 1] : null;

  // Validate API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set. Set it in .env.local or export it.");
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set. Vector embeddings require PostgreSQL with pgvector.");
    process.exit(1);
  }

  console.log("╔══════════════════════════════════════════╗");
  console.log("║   Xjoy — Embedding Generation           ║");
  console.log("╚══════════════════════════════════════════╝\n");

  // Load verses from JSON
  const dataPath = join(__dirname, "..", "data", "kjv.json");
  const raw = readFileSync(dataPath, "utf-8");
  const data: KJVData = JSON.parse(raw);

  let verses = data.verses;

  // Apply filters
  if (filterBook) {
    verses = verses.filter((v) => v.book === filterBook);
    if (verses.length === 0) {
      console.error(`No verses found for book: "${filterBook}"`);
      process.exit(1);
    }
    console.log(`Filtered to ${filterBook}: ${verses.length} verses`);
  }

  if (limit) {
    verses = verses.slice(0, limit);
    console.log(`Limited to first ${limit} verses`);
  }

  console.log(`Total verses to embed: ${verses.length}`);
  console.log(`Model: ${MODEL} (${DIMENSIONS} dimensions)`);
  console.log("");

  // Connect to PostgreSQL
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: dbUrl, max: 3 });

  try {
    // Ensure pgvector is available and embedding column exists
    console.log("Checking database schema...");
    await pool.query(`
      DO $$
      BEGIN
          CREATE EXTENSION IF NOT EXISTS vector;
      EXCEPTION
          WHEN OTHERS THEN
              RAISE NOTICE 'pgvector extension not available';
      END
      $$;
    `);

    // Add embedding column if it doesn't exist (idempotent)
    await pool.query(`
      ALTER TABLE verses
      ADD COLUMN IF NOT EXISTS embedding vector(1536);
    `);
    console.log("  Schema OK.\n");

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey });

    // Process in batches
    let processed = 0;
    let failed = 0;
    const totalBatches = Math.ceil(verses.length / BATCH_SIZE);
    const startTime = performance.now();

    for (let i = 0; i < verses.length; i += BATCH_SIZE) {
      const batch = verses.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;

      try {
        // Generate embeddings
        const response = await openai.embeddings.create({
          model: MODEL,
          input: batch.map((v) => v.text),
          dimensions: DIMENSIONS,
        });

        // Update PostgreSQL — one UPDATE per verse
        const pgClient = await pool.connect();
        try {
          await pgClient.query("BEGIN");

          for (let j = 0; j < batch.length; j++) {
            const verse = batch[j];
            const embedding = response.data[j].embedding;

            // Format as pgvector literal: [0.1,0.2,...]
            const vectorStr = `[${embedding.join(",")}]`;

            await pgClient.query(
              `UPDATE verses
               SET embedding = $1::vector
               WHERE book = $2 AND chapter = $3 AND verse = $4`,
              [vectorStr, verse.book, verse.chapter, verse.verse]
            );
          }

          await pgClient.query("COMMIT");
        } catch (err) {
          await pgClient.query("ROLLBACK");
          throw err;
        } finally {
          pgClient.release();
        }

        processed += batch.length;
      } catch (err) {
        failed += batch.length;
        console.error(
          `  ✗ Batch ${batchNum} failed: ${err instanceof Error ? err.message : err}`
        );
      }

      // Progress
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
      const pct = ((processed / verses.length) * 100).toFixed(1);
      console.log(
        `  Batch ${batchNum}/${totalBatches} | ${processed}/${verses.length} (${pct}%) | ${elapsed}s`
      );

      // Rate-limit safety
      if (i + BATCH_SIZE < verses.length) {
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }

    // ── Create vector index after data is loaded ──
    console.log("\nCreating vector similarity index...");
    try {
      // ivfflat needs some data to build clusters; skip for small datasets
      if (processed >= 1000) {
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_verses_embedding
          ON verses USING ivfflat (embedding vector_cosine_ops)
          WITH (lists = 100);
        `);
        console.log("  ivfflat index created.");
      } else {
        console.log("  Skipped (too few vectors for ivfflat).");
      }
    } catch (err) {
      console.warn(
        `  Index creation skipped: ${err instanceof Error ? err.message : err}`
      );
      console.warn("  Vector search will still work (sequential scan).");
    }

    // ── Summary ──
    const totalElapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✓ Done.`);
    console.log(`  Embedded: ${processed} verses`);
    if (failed > 0) console.log(`  Failed: ${failed} verses`);
    console.log(`  Time: ${totalElapsed}s`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
