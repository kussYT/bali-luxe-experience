/**
 * Sprint S1 validation — GO/NO-GO report (8 criteria).
 * Usage: npm run db:validate-s1
 * Requires DATABASE_URL in .env.local (or .env).
 */
import { config as loadEnv } from "dotenv";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
loadEnv({ path: join(root, ".env.local") });
loadEnv({ path: join(root, ".env") });

const url = process.env.DATABASE_URL?.trim();
const TEST_SLUG = "90s-fisherman-black";
const TEST_FRANCE_QTY = 42;

/** @type {{ id: number, name: string, go: boolean, detail: string }[]} */
const results = [];

function record(id, name, go, detail) {
  results.push({ id, name, go, detail });
  console.log(`  [${go ? "GO" : "NO-GO"}] #${id} ${name}`);
  if (detail) console.log(`       ${detail}`);
}

async function main() {
  console.log("\n=== Sprint S1 validation (8 criteria) ===\n");

  // ── #1 DATABASE_URL + connection + migrations table ──
  if (!url) {
    record(
      1,
      "DATABASE_URL configured and migrations OK",
      false,
      "Missing from .env.local / .env. Add DATABASE_URL=postgresql://user:pass@host:5432/dbname",
    );
    printSummary();
    process.exit(1);
  }

  const host = url.match(/@([^/]+)/)?.[1] ?? "unknown";
  const pool = new pg.Pool({
    connectionString: url,
    ssl: url.includes("localhost") || url.includes("127.0.0.1") ? false : { rejectUnauthorized: false },
  });

  try {
    await pool.query("SELECT 1");
  } catch (e) {
    record(1, "DATABASE_URL configured and migrations OK", false, `Connection failed: ${e.message}`);
    await pool.end().catch(() => {});
    printSummary();
    process.exit(1);
  }

  const mig = await pool.query(`SELECT filename FROM schema_migrations ORDER BY filename`);
  const hasInitial = mig.rows.some((r) => r.filename === "001_initial_schema.sql");
  if (hasInitial) {
    record(
      1,
      "DATABASE_URL configured and migrations OK",
      true,
      `Connected (host: ${host}). schema_migrations: ${mig.rows.map((r) => r.filename).join(", ")}`,
    );
  } else {
    record(
      1,
      "DATABASE_URL configured and migrations OK",
      false,
      "Connected but 001_initial_schema.sql not applied. Run: npm run db:setup",
    );
  }

  // ── #2 db:seed-catalog completed (data present) ──
  const counts = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM products) AS products,
      (SELECT COUNT(*)::int FROM product_variants) AS variants,
      (SELECT COUNT(*)::int FROM product_inventory) AS inventory
  `);
  const c = counts.rows[0];
  if (c.products >= 50) {
    record(2, "db:seed-catalog completed without error", true, `products=${c.products}, variants=${c.variants}, inventory=${c.inventory}`);
  } else {
    record(2, "db:seed-catalog completed without error", false, `Only ${c.products} products — run npm run db:setup`);
  }

  // ── #3 API source postgres ──
  const { getCatalogResponse } = await import("../server/api/catalog.mjs");
  const catalog = await getCatalogResponse();
  if (catalog.source === "postgres") {
    record(3, 'GET /api/catalog → source: "postgres"', true, `productCount=${catalog.productCount}`);
  } else {
    record(3, 'GET /api/catalog → source: "postgres"', false, `Got source: "${catalog.source}"`);
  }

  // ── #4 Published products have ≥ 1 variant ──
  const missingVariants = await pool.query(`
    SELECT COUNT(*)::int AS n FROM products p
    LEFT JOIN product_variants v ON v.product_id = p.id
    WHERE p.status = 'published' AND v.id IS NULL
  `);
  const shopifyVariants = await pool.query(
    `SELECT COUNT(*)::int AS n FROM product_variants WHERE shopify_variant_id IS NOT NULL`,
  );
  if (missingVariants.rows[0].n === 0) {
    const shopifyNote =
      shopifyVariants.rows[0].n > 0
        ? `${shopifyVariants.rows[0].n} variants with shopify_variant_id`
        : "warning: no shopify_variant_id (Shopify fetch may have failed; default variants only)";
    record(4, "All published products have ≥ 1 variant", true, shopifyNote);
  } else {
    record(4, "All published products have ≥ 1 variant", false, `${missingVariants.rows[0].n} products without variants`);
  }

  // ── #5 Each variant has france + bali inventory ──
  const badInv = await pool.query(`
    SELECT COUNT(*)::int AS n FROM (
      SELECT v.id FROM product_variants v
      JOIN products p ON p.id = v.product_id AND p.status = 'published'
      LEFT JOIN product_inventory i ON i.variant_id = v.id
      GROUP BY v.id
      HAVING COUNT(i.warehouse_id) < 2
    ) x
  `);
  if (badInv.rows[0].n === 0) {
    record(5, "Each variant has inventory rows (france + bali)", true, "All published variants have 2 warehouse rows");
  } else {
    record(5, "Each variant has inventory rows (france + bali)", false, `${badInv.rows[0].n} variants missing a warehouse row`);
  }

  // ── #6 stockFrance / stockBali match SQL ──
  const sqlStock = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN i.warehouse_id = 'france' THEN GREATEST(0, i.quantity - i.reserved) END), 0)::int AS fr,
       COALESCE(SUM(CASE WHEN i.warehouse_id = 'bali' THEN GREATEST(0, i.quantity - i.reserved) END), 0)::int AS bali
     FROM product_inventory i
     JOIN product_variants v ON v.id = i.variant_id
     JOIN products p ON p.id = v.product_id
     WHERE p.slug = $1`,
    [TEST_SLUG],
  );
  const apiProd = catalog.products.find((p) => p.slug === TEST_SLUG);
  if (
    apiProd &&
    apiProd.stockFrance === sqlStock.rows[0].fr &&
    apiProd.stockBali === sqlStock.rows[0].bali
  ) {
    record(
      6,
      "stockFrance / stockBali consistent with SQL",
      true,
      `${TEST_SLUG}: france=${apiProd.stockFrance}, bali=${apiProd.stockBali}`,
    );
  } else if (apiProd) {
    record(
      6,
      "stockFrance / stockBali consistent with SQL",
      false,
      `API fr=${apiProd.stockFrance} bali=${apiProd.stockBali} vs SQL fr=${sqlStock.rows[0].fr} bali=${sqlStock.rows[0].bali}`,
    );
  } else {
    record(6, "stockFrance / stockBali consistent with SQL", false, `Product ${TEST_SLUG} not in API response`);
  }

  // ── #7 Server catalog path does not use catalog.json ──
  if (catalog.source === "postgres") {
    record(
      7,
      "No server catalog read via catalog.json",
      true,
      "getCatalogResponse() uses fetchCatalogFromDb() when DATABASE_URL is set",
    );
  } else {
    record(
      7,
      "No server catalog read via catalog.json",
      false,
      `Server uses json-fallback (reads data/catalog.json). Set DATABASE_URL and run db:setup`,
    );
  }

  // ── #8 SQL write immediately visible in API ──
  const variantRow = await pool.query(
    `SELECT v.id FROM product_variants v
     JOIN products p ON p.id = v.product_id
     WHERE p.slug = $1 AND v.is_default = true
     LIMIT 1`,
    [TEST_SLUG],
  );
  if (variantRow.rows.length === 0) {
    record(8, "SQL inventory change reflected in API", false, `Default variant for ${TEST_SLUG} not found`);
  } else {
    const vid = variantRow.rows[0].id;
    const before = catalog.products.find((p) => p.slug === TEST_SLUG);
    const prevFrance =
      (await pool.query(
        `SELECT quantity FROM product_inventory WHERE variant_id = $1 AND warehouse_id = 'france'`,
        [vid],
      )).rows[0]?.quantity ?? 0;

    await pool.query(
      `UPDATE product_inventory SET quantity = $1, updated_at = now()
       WHERE variant_id = $2 AND warehouse_id = 'france'`,
      [TEST_FRANCE_QTY, vid],
    );

    const after = await getCatalogResponse();
    const frAfter = after.products.find((p) => p.slug === TEST_SLUG)?.stockFrance;

    await pool.query(
      `UPDATE product_inventory SET quantity = $1, updated_at = now()
       WHERE variant_id = $2 AND warehouse_id = 'france'`,
      [prevFrance, vid],
    );

    if (frAfter === TEST_FRANCE_QTY) {
      record(
        8,
        "SQL inventory change reflected in API",
        true,
        `stockFrance ${before?.stockFrance ?? "?"} → ${frAfter} during test (restored to ${prevFrance})`,
      );
    } else {
      record(8, "SQL inventory change reflected in API", false, `Expected stockFrance=${TEST_FRANCE_QTY}, got ${frAfter}`);
    }
  }

  await pool.end();
  printSummary();
  process.exit(results.every((r) => r.go) ? 0 : 1);
}

function printSummary() {
  const go = results.filter((r) => r.go).length;
  console.log(`\n=== Summary: ${go}/8 GO ===\n`);
  if (go === 8) {
    console.log("Sprint S1: GO — safe to start S2.\n");
  } else {
    console.log("Sprint S1: NO-GO — fix failures before S2.\n");
    for (const r of results.filter((x) => !x.go)) {
      console.log(`  • #${r.id}: ${r.detail}`);
    }
    console.log("");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
