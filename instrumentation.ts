/**
 * Runs once per Node server process (dev `next dev` / prod `next start`).
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { ensureDatabaseMigrations } = await import("@/server/db");
  await ensureDatabaseMigrations();
}
