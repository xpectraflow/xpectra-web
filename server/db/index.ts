import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import path from "node:path";
import * as schema from "@/server/db/schema";
import migrationJournal from "@/drizzle/meta/_journal.json";

const DATABASE_URL = process.env.DATABASE_URL as string;

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
  migrationPromise: Promise<void> | undefined;
};

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema });
export { pool };

type DrizzleMigrationJournalEntry = {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
};

type DrizzleMigrationJournal = {
  version: string;
  dialect: string;
  entries: DrizzleMigrationJournalEntry[];
};

function getLatestMigrationTimestamp(): number | null {
  const typedMigrationJournal = migrationJournal as DrizzleMigrationJournal;
  if (!typedMigrationJournal.entries.length) {
    return null;
  }

  return typedMigrationJournal.entries.reduce((currentMaxTimestamp, entry) => {
    return Math.max(currentMaxTimestamp, entry.when);
  }, 0);
}

async function getLatestAppliedMigrationTimestamp(): Promise<number | null> {
  const migrationTableExistsResult = await pool.query<{ migration_table_name: string | null }>(
    "SELECT to_regclass('public.__drizzle_migrations') AS migration_table_name",
  );
  const migrationTableName = migrationTableExistsResult.rows[0]?.migration_table_name ?? null;
  if (!migrationTableName) {
    return null;
  }

  const latestAppliedMigrationResult = await pool.query<{ created_at: string | number }>(
    'SELECT created_at FROM "__drizzle_migrations" ORDER BY created_at DESC LIMIT 1',
  );
  const latestAppliedMigrationRow = latestAppliedMigrationResult.rows[0];
  if (!latestAppliedMigrationRow) {
    return null;
  }

  const parsedCreatedAtTimestamp = Number(latestAppliedMigrationRow.created_at);
  if (Number.isNaN(parsedCreatedAtTimestamp)) {
    return null;
  }

  return parsedCreatedAtTimestamp;
}

async function runPendingMigrationsIfNeeded(): Promise<void> {
  const latestLocalMigrationTimestamp = getLatestMigrationTimestamp();
  if (latestLocalMigrationTimestamp === null) {
    return;
  }

  const latestAppliedMigrationTimestamp = await getLatestAppliedMigrationTimestamp();
  const isLatestMigrationApplied =
    latestAppliedMigrationTimestamp !== null &&
    latestAppliedMigrationTimestamp >= latestLocalMigrationTimestamp;

  if (isLatestMigrationApplied) {
    return;
  }

  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "drizzle"),
  });
}

export async function ensureDatabaseMigrations(): Promise<void> {
  if (!globalForDb.migrationPromise) {
    globalForDb.migrationPromise = runPendingMigrationsIfNeeded().catch((error: unknown) => {
      globalForDb.migrationPromise = undefined;
      console.error("Failed to run Drizzle migrations during startup", error);
      throw error;
    });
  }

  await globalForDb.migrationPromise;
}
