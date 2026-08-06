/**
 * Server-side environment validation.
 * Validates all required env vars at startup and provides typed access.
 */

const requiredVars = [
  "DATABASE_URL",
  "ANTHROPIC_API_KEY",
] as const;

const optionalVars = [
  "NEXT_PUBLIC_SENTRY_DSN",
  "SENTRY_AUTH_TOKEN",
  "SENTRY_ORG",
  "SENTRY_PROJECT",
  "NEXT_PUBLIC_APP_URL",
] as const;

export function validateEnv(): void {
  const missing = requiredVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}.\n` +
        `Copy .env.example to .env.local and fill in the values.`
    );
  }

  const missingOptional = optionalVars.filter(
    (key) => !process.env[key]
  );

  if (missingOptional.length > 0) {
    console.warn(
      `⚠ Missing optional environment variables: ${missingOptional.join(", ")}`
    );
  }
}

export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}
