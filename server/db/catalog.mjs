import { query, isDatabaseConfigured } from "./pool.mjs";

function mapOriginToWarehouse(origin) {
  return origin === "France" ? "france" : "bali";
}

function buildVariantSlug(productSlug, variantTitle, index) {
  const base = variantTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!base || base === "default-title" || base === "default") {
    return `${productSlug}-default`;
  }
  return `${productSlug}-${base}`;
}

/**
 * Fetch full catalog from Postgres for API + storefront.
 */
export async function fetchCatalogFromDb({ includeDrafts = false } = {}) {
  if (!isDatabaseConfigured()) {
    const err = new Error("Database not configured");
    err.status = 503;
    throw err;
  }

  const statusFilter = includeDrafts ? "" : "WHERE p.status = 'published'";

  const { rows: collectionRows } = await query(
    `SELECT slug, name, season FROM collections ORDER BY name ASC`,
  );

  const { rows: productRows } = await query(
    `
    SELECT
      p.id,
      p.slug,
      p.name,
      p.story,
      p.subcategory,
      p.category,
      p.product_type,
      p.price_eur,
      p.compare_at_eur,
      p.price_usd,
      p.price_idr,
      p.status,
      p.featured,
      p.origin,
      p.default_warehouse,
      c.slug AS collection_slug,
      c.name AS collection_name
    FROM products p
    LEFT JOIN collections c ON c.id = p.collection_id
    ${statusFilter}
    ORDER BY p.name ASC
    `,
  );

  if (productRows.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      store: "https://bingindiaries.com",
      productCount: 0,
      collections: collectionRows.map((c) => ({
        slug: c.slug,
        name: c.name,
        season: c.season || "",
      })),
      products: [],
      source: "postgres",
    };
  }

  const productIds = productRows.map((p) => p.id);

  const { rows: imageRows } = await query(
    `SELECT product_id, url, position FROM product_images
     WHERE product_id = ANY($1::uuid[])
     ORDER BY position ASC`,
    [productIds],
  );

  const { rows: variantRows } = await query(
    `SELECT
       v.id,
       v.product_id,
       v.slug,
       v.sku,
       v.title,
       v.option1,
       v.option2,
       v.option3,
       v.price_eur,
       v.compare_at_eur,
       v.is_default,
       v.position
     FROM product_variants v
     WHERE v.product_id = ANY($1::uuid[])
     ORDER BY v.position ASC, v.title ASC`,
    [productIds],
  );

  const variantIds = variantRows.map((v) => v.id);
  let inventoryRows = [];
  if (variantIds.length > 0) {
    const inv = await query(
      `SELECT variant_id, warehouse_id, quantity, reserved
       FROM product_inventory
       WHERE variant_id = ANY($1::uuid[])`,
      [variantIds],
    );
    inventoryRows = inv.rows;
  }

  const imagesByProduct = new Map();
  for (const img of imageRows) {
    if (!imagesByProduct.has(img.product_id)) imagesByProduct.set(img.product_id, []);
    imagesByProduct.get(img.product_id).push(img.url);
  }

  const inventoryByVariant = new Map();
  for (const inv of inventoryRows) {
    if (!inventoryByVariant.has(inv.variant_id)) {
      inventoryByVariant.set(inv.variant_id, { france: 0, bali: 0 });
    }
    const bucket = inventoryByVariant.get(inv.variant_id);
    bucket[inv.warehouse_id] = Math.max(0, inv.quantity - inv.reserved);
  }

  const variantsByProduct = new Map();
  for (const v of variantRows) {
    if (!variantsByProduct.has(v.product_id)) variantsByProduct.set(v.product_id, []);
    const inv = inventoryByVariant.get(v.id) || { france: 0, bali: 0 };
    const available = inv.france + inv.bali > 0;
    variantsByProduct.get(v.product_id).push({
      id: v.id,
      slug: v.slug,
      sku: v.sku || undefined,
      title: v.title,
      option1: v.option1 || undefined,
      option2: v.option2 || undefined,
      option3: v.option3 || undefined,
      priceEUR: v.price_eur ?? undefined,
      compareAtEUR: v.compare_at_eur ?? undefined,
      isDefault: v.is_default,
      inventory: inv,
      available,
    });
  }

  const products = productRows.map((p) => {
    const images = imagesByProduct.get(p.id) || [];
    const variants = variantsByProduct.get(p.id) || [];
    const stockFrance = variants.reduce((s, v) => s + v.inventory.france, 0);
    const stockBali = variants.reduce((s, v) => s + v.inventory.bali, 0);
    const stock = stockFrance + stockBali;
    const onSale = p.compare_at_eur != null && p.compare_at_eur < p.price_eur;
    const available = stock > 0 && p.status === "published";

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      story: p.story,
      collection: p.collection_name || "Shop",
      collectionSlug: p.collection_slug || "shop",
      subcategory: p.subcategory,
      category: p.category,
      productType: p.product_type,
      priceEUR: p.price_eur,
      compareAtEUR: onSale ? p.compare_at_eur : undefined,
      priceUSD: p.price_usd,
      priceIDR: p.price_idr,
      image: images[0] || "/shopify-import/placeholder.jpg",
      images,
      details: p.product_type ? [p.product_type] : [],
      tags: [],
      stock,
      stockFrance,
      stockBali,
      status: p.status,
      featured: p.featured,
      onSale,
      available,
      origin: p.origin,
      defaultWarehouse: p.default_warehouse,
      variants,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    store: "https://bingindiaries.com",
    productCount: products.length,
    collections: collectionRows.map((c) => ({
      slug: c.slug,
      name: c.name,
      season: c.season || "",
    })),
    products,
    source: "postgres",
  };
}

export { mapOriginToWarehouse, buildVariantSlug };
