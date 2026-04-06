/**
 * Runs Drizzle migrations with explicit stdout (drizzle-kit migrate clears the TTY
 * after success, which often looks like "nothing happened" in Windows PowerShell).
 */
import "dotenv/config";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = join(__dirname, "..", "drizzle");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || databaseUrl.trim() === "") {
  console.error(
    "DATABASE_URL is missing or empty. Set it in .env (see your deployment docs).",
  );
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
const db = drizzle(pool);

try {
  console.log(`Applying migrations from: ${migrationsFolder}`);
  await migrate(db, { migrationsFolder });
  console.log("Migrations finished successfully.");
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
} finally {
  await pool.end();
}
