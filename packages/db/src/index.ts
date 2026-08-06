/**
 * Database client configuration.
 * Used by migration and seed scripts.
 *
 * For runtime queries, use the connection pool in @/lib/db.
 */

export interface DbConfig {
  connectionString: string;
  maxConnections?: number;
}

export function getDbConfig(): DbConfig {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return {
    connectionString: url,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || "10", 10),
  };
}
