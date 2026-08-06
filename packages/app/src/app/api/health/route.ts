/**
 * Health check endpoint for Fly.io and monitoring.
 *
 * Returns app status and basic DB connectivity.
 * Fly.io health checks hit this every 30s.
 */
import { NextResponse } from "next/server";

export async function GET() {
  let dbStatus: "ok" | "unreachable" = "unreachable";

  // Lightweight DB connectivity check
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      connectionTimeoutMillis: 3000,
      // Fail fast — this is a health check, not a query
      idleTimeoutMillis: 2000,
    });
    await pool.query("SELECT 1");
    await pool.end();
    dbStatus = "ok";
  } catch {
    dbStatus = "unreachable";
  }

  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      db: dbStatus,
    },
    { status: 200 }
  );
}
