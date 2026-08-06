/**
 * Database migration runner.
 * Usage: npm run db:migrate
 *
 * Reads schema.sql and executes it against the DATABASE_URL connection.
 * Idempotent — safe to run multiple times.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { getDbConfig } from "./index";
// Using dynamic import since pg might not be available during build
async function main() {
  const { Pool } = await import("pg");
  const { connectionString } = getDbConfig();
  const pool = new Pool({ connectionString, max: 1 });

  try {
    const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");
    console.log("Running database migration...");
    await pool.query(schema);
    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
