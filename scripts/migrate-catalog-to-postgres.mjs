/**
 * Import catalog JSON + Shopify variants → Postgres
 * Usage:
 *   npm run db:migrate
 *   npm run db:seed-catalog
 *   npm run db:seed-catalog -- --reset   (truncate catalog tables first)
 */
import { config as loadEnv } from "dotenv";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { mapOriginToWarehouse, buildVariantSlug } from "../server/db/catalog.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const STORE = "https://bingindiaries.com";

loadEnv({ path: join(root, ".env.local") });
loadEnv({ path: join(root, ".env") });

const url = process.env.DATABASE_URL?.trim();
const reset = process.argv.includes("--reset");

if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url });

async function loadCatalogJson() {
  const paths = [
    join(root, "data", "catalog.json"),
    join(root, "src", "data", "catalog.json"),
  ];
  for (const p of paths) {
    try {
      return JSON.parse(await readFile(p, "utf8"));
    } catch {
      /* try next */
    }
  }
  throw new Error("catalog.json not found in data/ or src/data/");
}

async function loadShopifyProducts() {
  try {
    const res = await fetch(`${STORE}/products.json?limit=250`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { products } = await res.json();
    return Object.fromEntries(products.map((p) => [p.handle, p]));
  } catch (e) {
    console.warn("Shopify products.json unavailable:", e.message);
    console.warn("  → creating default variants from catalog.json only");
    return {};
  }
}

function variantTitleFromShopify(v) {
  if (v.title && v.title !== "Default Title") return v.title;
  const parts = [v.option1, v.option2, v.option3].filter(Boolean);
  return parts.length ? parts.join(" / ") : "Default";
}

async function upsertCollection(client, { slug, name, season }) {
  const { rows } = await client.query(
    `INSERT INTO collections (slug, name, season)
     VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, season = EXCLUDED.season, updated_at = now()
     RETURNING id`,
    [slug, name, season || ""],
  );
  return rows[0].id;
}

async function upsertProduct(client, collectionId, p, shopify) {
  const onSale = p.compareAtEUR != null && p.compareAtEUR < p.priceEUR;
  const defaultWarehouse = mapOriginToWarehouse(p.origin);

  const { rows } = await client.query(
    `INSERT INTO products (
       slug, name, story, collection_id, subcategory, category, product_type,
       price_eur, compare_at_eur, price_usd, price_idr, status, featured, origin,
       default_warehouse, shopify_product_id, updated_at
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16, now()
     )
     ON CONFLICT (slug) DO UPDATE SET
       name = EXCLUDED.name,
       story = EXCLUDED.story,
       collection_id = EXCLUDED.collection_id,
       subcategory = EXCLUDED.subcategory,
       category = EXCLUDED.category,
       product_type = EXCLUDED.product_type,
       price_eur = EXCLUDED.price_eur,
       compare_at_eur = EXCLUDED.compare_at_eur,
       price_usd = EXCLUDED.price_usd,
       price_idr = EXCLUDED.price_idr,
       status = EXCLUDED.status,
       featured = EXCLUDED.featured,
       origin = EXCLUDED.origin,
       default_warehouse = EXCLUDED.default_warehouse,
       shopify_product_id = EXCLUDED.shopify_product_id,
       updated_at = now()
     RETURNING id`,
    [
      p.slug,
      p.name,
      p.story || "",
      collectionId,
      p.subcategory || "",
      p.category || "hats",
      p.productType || "",
      p.priceEUR,
      onSale ? p.compareAtEUR : null,
      p.priceUSD,
      p.priceIDR,
      p.status === "draft" ? "draft" : "published",
      Boolean(p.featured),
      p.origin === "France" ? "France" : "Bali",
      defaultWarehouse,
      shopify?.id ?? null,
    ],
  );
  const productId = rows[0].id;

  await client.query(`DELETE FROM product_images WHERE product_id = $1`, [productId]);
  const images = p.images?.length ? p.images : [p.image].filter(Boolean);
  for (let i = 0; i < images.length; i++) {
    await client.query(
      `INSERT INTO product_images (product_id, url, position) VALUES ($1, $2, $3)`,
      [productId, images[i], i],
    );
  }

  const shopifyVariants = shopify?.variants?.length ? shopify.variants : null;
  const variants = shopifyVariants || [
    {
      id: null,
      title: "Default",
      sku: p.slug,
      price: String(p.priceEUR),
      compare_at_price: onSale ? String(p.compareAtEUR) : null,
      inventory_quantity: p.stock ?? 1,
      option1: null,
      option2: null,
      option3: null,
    },
  ];

  await client.query(`DELETE FROM product_inventory WHERE variant_id IN (
    SELECT id FROM product_variants WHERE product_id = $1
  )`, [productId]);
  await client.query(`DELETE FROM product_variants WHERE product_id = $1`, [productId]);

  let position = 0;
  for (const sv of variants) {
    const title = variantTitleFromShopify(sv);
    const vSlug = buildVariantSlug(p.slug, title, position);
    const price = Math.round(parseFloat(sv.price || p.priceEUR));
    const compare = sv.compare_at_price ? Math.round(parseFloat(sv.compare_at_price)) : null;
    const onSaleV = compare != null && compare < price;
    const qty = Math.max(0, Number(sv.inventory_quantity ?? p.stock ?? 0));

    const { rows: vRows } = await client.query(
      `INSERT INTO product_variants (
         product_id, slug, sku, title, option1, option2, option3,
         price_eur, compare_at_eur, position, shopify_variant_id, is_default
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id`,
      [
        productId,
        vSlug,
        sv.sku || null,
        title,
        sv.option1 || null,
        sv.option2 || null,
        sv.option3 || null,
        price,
        onSaleV ? compare : null,
        position,
        sv.id ?? null,
        position === 0,
      ],
    );
    const variantId = vRows[0].id;
    position++;

    const primary = defaultWarehouse;
    const secondary = primary === "bali" ? "france" : "bali";
    await client.query(
      `INSERT INTO product_inventory (variant_id, warehouse_id, quantity, reserved)
       VALUES ($1, $2, $3, 0)
       ON CONFLICT (variant_id, warehouse_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
      [variantId, primary, qty],
    );
    await client.query(
      `INSERT INTO product_inventory (variant_id, warehouse_id, quantity, reserved)
       VALUES ($1, $2, 0, 0)
       ON CONFLICT (variant_id, warehouse_id) DO UPDATE SET quantity = 0`,
      [variantId, secondary],
    );
  }

  return productId;
}

async function main() {
  const catalog = await loadCatalogJson();
  const shopifyByHandle = await loadShopifyProducts();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (reset) {
      console.log("Resetting catalog tables…");
      await client.query(`
        TRUNCATE inventory_movements, product_inventory, product_variants,
                 product_images, products, collections CASCADE
      `);
    }

    const collectionIds = new Map();
    for (const c of catalog.collections || []) {
      const id = await upsertCollection(client, c);
      collectionIds.set(c.slug, id);
    }

    let count = 0;
    for (const p of catalog.products || []) {
      const collectionId = collectionIds.get(p.collectionSlug) ?? null;
      await upsertProduct(client, collectionId, p, shopifyByHandle[p.slug]);
      count++;
      if (count % 10 === 0) console.log(`  ${count}/${catalog.products.length} products…`);
    }

    await client.query("COMMIT");
    console.log(`Imported ${count} products into Postgres.`);

    const { rows: stats } = await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM products) AS products,
        (SELECT COUNT(*)::int FROM product_variants) AS variants,
        (SELECT COALESCE(SUM(quantity),0)::int FROM product_inventory WHERE warehouse_id = 'france') AS stock_france,
        (SELECT COALESCE(SUM(quantity),0)::int FROM product_inventory WHERE warehouse_id = 'bali') AS stock_bali
    `);
    console.log("Stats:", stats[0]);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
