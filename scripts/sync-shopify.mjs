/**
 * Full Shopify content sync — catalog, sales, brand pages, CMS defaults.
 * Usage: npm run shopify:sync
 */
import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import {
  buildBrandContent,
  buildCatalogFromShopify,
  loadShopifySnapshot,
} from "../server/shopify-sync.mjs";
import { query, isDatabaseConfigured } from "../server/db/pool.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
loadEnv({ path: join(root, ".env.local") });
loadEnv({ path: join(root, ".env") });

const MANIFEST = join(root, "public", "shopify-import", "manifest.json");
const CATALOG_PATHS = [
  join(root, "src", "data", "catalog.json"),
  join(root, "data", "catalog.json"),
  join(root, "public", "catalog.json"),
];
const SNAPSHOT_DIR = join(root, "data", "shopify-snapshot");
const BRAND_TS = join(root, "src", "data", "brand-content.ts");

async function writeCatalog(catalog) {
  const json = `${JSON.stringify(catalog, null, 2)}\n`;
  await Promise.all(CATALOG_PATHS.map((p) => writeFile(p, json, "utf8")));
}

async function syncCollectionsToDb(collections) {
  if (!isDatabaseConfigured()) return;
  for (const col of collections) {
    await query(
      `INSERT INTO collections (slug, name, season, description, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         sort_order = EXCLUDED.sort_order,
         updated_at = now()`,
      [col.slug, col.name, col.season || "", col.description || "", col.sortOrder ?? 0],
    );
  }
  console.log(`Postgres: ${collections.length} collections synced.`);
}

async function syncSalePricesToDb(products) {
  if (!isDatabaseConfigured()) {
    console.log("DATABASE_URL not set — skipping Postgres sale sync.");
    return;
  }
  let updated = 0;
  for (const p of products) {
    const res = await query(
      `UPDATE products
       SET price_eur = $2,
           compare_at_eur = $3,
           updated_at = now()
       WHERE slug = $1`,
      [p.slug, p.priceEUR, p.compareAtEUR ?? null],
    );
    if (res.rowCount) updated += res.rowCount;
  }
  console.log(`Postgres: ${updated} products updated with Shopify pricing.`);
}

function serializeBrandTs(brand) {
  return `/** Auto-generated from Shopify — npm run shopify:sync */
export const BRAND_CONTENT = ${JSON.stringify(brand, null, 2)} as const;

export type BrandSection = (typeof BRAND_CONTENT.about.sections)[number];
export type CareSection = (typeof BRAND_CONTENT.care.sections)[number];
`;
}

async function main() {
  console.log("Syncing from Shopify…\n");

  const catalog = await buildCatalogFromShopify({ manifestPath: MANIFEST });
  await writeCatalog(catalog);
  console.log(
    `Catalog: ${catalog.productCount} products, ${catalog.collections.length} collections`,
  );
  console.log(`  Sales: ${catalog.snapshot.saleCount} | Outlet: ${catalog.snapshot.outletCount}`);

  const snapshot = await loadShopifySnapshot();
  const brand = buildBrandContent(snapshot.pagesByHandle);
  await mkdir(SNAPSHOT_DIR, { recursive: true });
  await writeFile(join(SNAPSHOT_DIR, "brand-content.json"), JSON.stringify(brand, null, 2));
  await writeFile(join(SNAPSHOT_DIR, "collections.json"), JSON.stringify(snapshot.collections, null, 2));
  await writeFile(
    join(SNAPSHOT_DIR, "pages-index.json"),
    JSON.stringify(
      snapshot.pages.map((p) => ({ handle: p.handle, title: p.title })),
      null,
      2,
    ),
  );
  await writeFile(BRAND_TS, serializeBrandTs(brand));

  await syncCollectionsToDb(catalog.collections);
  await syncSalePricesToDb(catalog.products);

  console.log(`\nWrote brand content → ${BRAND_TS}`);
  console.log("Done. Run npm run deploy to publish.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
