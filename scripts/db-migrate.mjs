/**
 * Apply SQL migrations in db/migrations/
 * Usage: npm run db:migrate
 */
import { config as loadEnv } from "dotenv";
import { readFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
loadEnv({ path: join(root, ".env.local") });
loadEnv({ path: join(root, ".env") });

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL is required. Add it to .env.local");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url });

async function main() {
  const dir = join(root, "db", "migrations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  for (const file of files) {
    const { rows } = await pool.query(`SELECT 1 FROM schema_migrations WHERE filename = $1`, [file]);
    if (rows.length > 0) {
      console.log(`  skip ${file}`);
      continue;
    }
    const sql = await readFile(join(dir, file), "utf8");
    console.log(`  apply ${file}`);
    await pool.query(sql);
    await pool.query(`INSERT INTO schema_migrations (filename) VALUES ($1)`, [file]);
  }

  console.log("Migrations complete.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
