/**
 * Database client configuration.
 * Uses a connection pool — in production this connects to the Fly.io managed Postgres.
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

/**
 * Migrate the database schema.
 * Called during deployment or via `npm run db:migrate`.
 */
export async function migrate(): Promise<void> {
  const { connectionString } = getDbConfig();
  // Migration logic will be implemented when pg client is added
  console.log(`Connecting to database for migration...`);
}
