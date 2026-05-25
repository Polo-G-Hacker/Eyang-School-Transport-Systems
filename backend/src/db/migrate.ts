/* Simple migration runner: applies every *.sql file in db/migrations in order.
   Tracks applied files in a `schema_migrations` table. Idempotent. */
import * as fs from "fs";
import * as path from "path";
import { pool } from "./pool";
import { logger } from "../config/logger";

async function ensureTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function applied(): Promise<Set<string>> {
  const { rows } = await pool.query<{ filename: string }>(
    "SELECT filename FROM schema_migrations",
  );
  return new Set(rows.map((r) => r.filename));
}

async function main(): Promise<void> {
  const dir = path.join(__dirname, "migrations");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  await ensureTable();
  const already = await applied();

  for (const file of files) {
    if (already.has(file)) {
      logger.info("migration:skip", { file });
      continue;
    }
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    logger.info("migration:apply", { file });
    await pool.query("BEGIN");
    try {
      await pool.query(sql);
      await pool.query("INSERT INTO schema_migrations(filename) VALUES ($1)", [file]);
      await pool.query("COMMIT");
    } catch (err) {
      await pool.query("ROLLBACK");
      logger.error("migration:failed", { file, err: (err as Error).message });
      throw err;
    }
  }

  logger.info("migration:done");
  await pool.end();
}

main().catch((err) => {
  logger.error("migration:fatal", { err: (err as Error).message });
  process.exit(1);
});
