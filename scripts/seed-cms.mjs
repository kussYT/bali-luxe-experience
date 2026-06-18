/**
 * Seed CMS defaults (posts, pages, homepage, announcement) into Postgres.
 * Usage: npm run db:seed-cms
 */
import { config as loadEnv } from "dotenv";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { seedCmsContent } from "../server/api/content-admin.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
loadEnv({ path: join(root, ".env.local") });
loadEnv({ path: join(root, ".env") });

if (!process.env.DATABASE_URL?.trim()) {
  console.error("DATABASE_URL is required. Add it to .env.local");
  process.exit(1);
}

const result = await seedCmsContent();
console.log("CMS seed complete:", result);
