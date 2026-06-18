/**
 * @deprecated Use npm run shopify:sync — sale prices come from Shopify compare_at_price.
 */
import { config as loadEnv } from "dotenv";
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SALE_PROMOS } from "../data/sale-promos.mjs";
import { query, isDatabaseConfigured } from "../server/db/pool.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
loadEnv({ path: join(root, ".env.local") });
loadEnv({ path: join(root, ".env") });

const CATALOG_PATHS = [
  join(root, "src", "data", "catalog.json"),
  join(root, "data", "catalog.json"),
  join(root, "public", "catalog.json"),
];

async function patchCatalogFile(filePath) {
  let raw;
  try {
    raw = await readFile(filePath, "utf8");
  } catch {
    return { path: filePath, skipped: true };
  }

  const catalog = JSON.parse(raw);
  const bySlug = new Map(SALE_PROMOS.map((p) => [p.slug, p.compareAtEUR]));
  let updated = 0;

  for (const product of catalog.products ?? []) {
    const promo = bySlug.get(product.slug);
    if (promo == null) continue;
    if (promo >= product.priceEUR) {
      console.warn(`  skip ${product.slug}: promo ${promo} >= list ${product.priceEUR}`);
      continue;
    }
    product.compareAtEUR = promo;
    product.onSale = true;
    updated += 1;
  }

  await writeFile(filePath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  return { path: filePath, updated };
}

async function patchDatabase() {
  if (!isDatabaseConfigured()) {
    console.log("DATABASE_URL not set — skipping Postgres.");
    return 0;
  }

  let count = 0;
  for (const { slug, compareAtEUR } of SALE_PROMOS) {
    const res = await query(
      `UPDATE products p
       SET compare_at_eur = $2, updated_at = now()
       WHERE p.slug = $1
         AND p.price_eur > $2
       RETURNING p.slug, p.price_eur`,
      [slug, compareAtEUR],
    );
    if (res.rowCount > 0) {
      count += res.rowCount;
      console.log(`  db: ${slug} → €${compareAtEUR} (was €${res.rows[0].price_eur})`);
    } else {
      console.warn(`  db: ${slug} not updated (missing or promo >= list price)`);
    }

    await query(
      `UPDATE product_variants v
       SET compare_at_eur = $2
       FROM products p
       WHERE v.product_id = p.id AND p.slug = $1 AND p.price_eur > $2`,
      [slug, compareAtEUR],
    );
  }
  return count;
}

console.log(`Applying ${SALE_PROMOS.length} sale promos…\n`);

for (const filePath of CATALOG_PATHS) {
  const result = await patchCatalogFile(filePath);
  if (result.skipped) continue;
  console.log(`catalog: ${result.path} (${result.updated} products)`);
}

const dbCount = await patchDatabase();
console.log(`\nDone. ${dbCount} product(s) updated in Postgres.`);
