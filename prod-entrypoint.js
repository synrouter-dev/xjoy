/**
 * Xjoy Production Entrypoint
 *
 * Runs database migration + seed before starting the Next.js server.
 * Written in plain JS so it runs in the production Docker image without
 * TypeScript compilation.
 *
 * Both migration and seed are idempotent:
 * - Migration uses IF NOT EXISTS / DO blocks
 * - Seed uses ON CONFLICT DO NOTHING
 */

const { Pool } = require("pg");
const { readFileSync, existsSync } = require("fs");
const { join } = require("path");

const DATABASE_URL = process.env.DATABASE_URL;
const BATCH_SIZE = 500;

async function runMigration(pool) {
  const schemaPath = join(__dirname, "schema.sql");
  if (!existsSync(schemaPath)) {
    console.warn("schema.sql not found — skipping migration.");
    return;
  }
  const schema = readFileSync(schemaPath, "utf-8");
  console.log("📦 Running database migration...");
  await pool.query(schema);
  console.log("✓ Migration complete.");
}

async function runSeed(pool) {
  const dataPath = join(__dirname, "data", "kjv.json");
  if (!existsSync(dataPath)) {
    console.warn("data/kjv.json not found — skipping seed.");
    return;
  }
  const raw = readFileSync(dataPath, "utf-8");
  const data = JSON.parse(raw);
  const verses = data.verses;
  if (!verses || !Array.isArray(verses)) {
    console.warn("Invalid KJV data format — skipping seed.");
    return;
  }

  console.log(`🌱 Seeding ${verses.length} verses...`);

  let inserted = 0;
  for (let i = 0; i < verses.length; i += BATCH_SIZE) {
    const batch = verses.slice(i, i + BATCH_SIZE);
    const values = [];
    const params = [];
    let paramIdx = 1;

    for (const v of batch) {
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

    if ((i / BATCH_SIZE) % 10 === 0) {
      const pct = Math.round(((i + batch.length) / verses.length) * 100);
      process.stdout.write(`\r  ${pct}% — ${inserted} inserted`);
    }
  }

  console.log(`\n✓ Seed complete — ${inserted} verses inserted.`);

  // Update query planner statistics
  await pool.query("ANALYZE verses");
  console.log("✓ Statistics updated.");
}

async function main() {
  if (!DATABASE_URL) {
    console.warn("DATABASE_URL not set — skipping database setup. Starting app...");
    require("./server.js");
    return;
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 3,
    connectionTimeoutMillis: 10000,
  });

  try {
    await runMigration(pool);
    await runSeed(pool);
  } catch (err) {
    console.error("Database setup failed:", err.message);
    console.warn("Continuing to start app (DB may not be ready yet)...");
  } finally {
    await pool.end();
  }

  // Start the Next.js server
  console.log("🚀 Starting Xjoy server...");
  require("./server.js");
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
