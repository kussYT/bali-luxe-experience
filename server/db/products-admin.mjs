import { withTransaction, query, isDatabaseConfigured } from "./pool.mjs";
import { mapOriginToWarehouse, buildVariantSlug } from "./catalog.mjs";

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeAdminProductBody(body) {
  const priceEUR = Number(body.priceEUR) || 0;
  const compareRaw =
    body.compareAtEUR != null && body.compareAtEUR !== "" ? Number(body.compareAtEUR) : null;
  const onSale = compareRaw != null && compareRaw < priceEUR;
  const images =
    Array.isArray(body.images) && body.images.length > 0
      ? body.images
      : body.image
        ? [body.image]
        : [];

  return {
    slug: slugify(body.slug || body.name || "product"),
    name: body.name || "Untitled",
    story: body.story || "",
    collection: body.collection || "Shop",
    collectionSlug: slugify(body.collectionSlug || body.collection || "shop"),
    subcategory: body.subcategory || "",
    category: body.category || "hats",
    productType: body.productType || "",
    priceEUR,
    compareAtEUR: onSale ? compareRaw : null,
    priceUSD: Number(body.priceUSD) || Math.round(priceEUR * 1.1),
    priceIDR: Number(body.priceIDR) || Math.round(priceEUR * 17_000),
    status: body.status === "draft" ? "draft" : "published",
    featured: Boolean(body.featured),
    origin: body.origin === "France" ? "France" : "Bali",
    stock: Math.max(0, Number(body.stock ?? 0)),
    images,
    variants: parseAdminVariants(body),
  };
}

function parseAdminVariants(body) {
  const raw = Array.isArray(body.variants) ? body.variants : [];
  const parsed = raw
    .map((v, i) => ({
      id: v.id || null,
      title: String(v.title ?? "").trim() || (i === 0 ? "Default" : ""),
      stock: Math.max(0, Number(v.stock) || 0),
    }))
    .filter((v) => v.title);

  if (parsed.length > 0) return parsed;

  return [{ id: null, title: "Default", stock: Math.max(0, Number(body.stock) || 0) }];
}

async function upsertCollection(client, { slug, name, season = "" }) {
  const { rows } = await client.query(
    `INSERT INTO collections (slug, name, season)
     VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, updated_at = now()
     RETURNING id`,
    [slug, name, season],
  );
  return rows[0].id;
}

async function replaceImages(client, productId, images) {
  await client.query(`DELETE FROM product_images WHERE product_id = $1`, [productId]);
  for (let i = 0; i < images.length; i++) {
    await client.query(
      `INSERT INTO product_images (product_id, url, position) VALUES ($1, $2, $3)`,
      [productId, images[i], i],
    );
  }
}

async function createVariantWithInventory(client, productId, p, variant, position, isDefault) {
  const defaultWarehouse = mapOriginToWarehouse(p.origin);
  const secondary = defaultWarehouse === "bali" ? "france" : "bali";
  const variantSlug = buildVariantSlug(p.slug, variant.title, position);

  const { rows } = await client.query(
    `INSERT INTO product_variants (
       product_id, slug, sku, title, option1, price_eur, compare_at_eur, position, is_default
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      productId,
      variantSlug,
      p.slug,
      variant.title,
      variant.title === "Default" ? null : variant.title,
      p.priceEUR,
      p.compareAtEUR,
      position,
      isDefault,
    ],
  );
  const variantId = rows[0].id;

  await client.query(
    `INSERT INTO product_inventory (variant_id, warehouse_id, quantity, reserved)
     VALUES ($1, $2, $3, 0)`,
    [variantId, defaultWarehouse, variant.stock],
  );
  await client.query(
    `INSERT INTO product_inventory (variant_id, warehouse_id, quantity, reserved)
     VALUES ($1, $2, 0, 0)`,
    [variantId, secondary],
  );

  return variantId;
}

async function setVariantPrimaryStock(client, variantId, warehouseId, nextQty, productSlug) {
  const { rows } = await client.query(
    `SELECT quantity FROM product_inventory WHERE variant_id = $1 AND warehouse_id = $2`,
    [variantId, warehouseId],
  );
  if (rows.length === 0) {
    await client.query(
      `INSERT INTO product_inventory (variant_id, warehouse_id, quantity, reserved)
       VALUES ($1, $2, $3, 0)`,
      [variantId, warehouseId, nextQty],
    );
    return;
  }
  const current = rows[0].quantity;
  if (current === nextQty) return;
  await client.query(
    `UPDATE product_inventory SET quantity = $1, updated_at = now()
     WHERE variant_id = $2 AND warehouse_id = $3`,
    [nextQty, variantId, warehouseId],
  );
  await client.query(
    `INSERT INTO inventory_movements (variant_id, warehouse_id, delta, reason, note)
     VALUES ($1, $2, $3, 'catalog_update', $4)`,
    [variantId, warehouseId, nextQty - current, `Product edit: ${productSlug}`],
  );
}

async function syncProductVariants(client, productId, p) {
  const defaultWarehouse = mapOriginToWarehouse(p.origin);
  const { rows: existing } = await client.query(
    `SELECT id FROM product_variants WHERE product_id = $1 ORDER BY position ASC`,
    [productId],
  );
  const keepIds = new Set();

  for (let i = 0; i < p.variants.length; i++) {
    const variant = p.variants[i];
    const isDefault = i === 0;
    const position = i;
    const variantSlug = buildVariantSlug(p.slug, variant.title, position);
    const option1 = variant.title === "Default" ? null : variant.title;

    if (variant.id && existing.some((row) => row.id === variant.id)) {
      keepIds.add(variant.id);
      await client.query(
        `UPDATE product_variants SET
           slug = $2,
           title = $3,
           option1 = $4,
           price_eur = $5,
           compare_at_eur = $6,
           position = $7,
           is_default = $8,
           updated_at = now()
         WHERE id = $1`,
        [
          variant.id,
          variantSlug,
          variant.title,
          option1,
          p.priceEUR,
          p.compareAtEUR,
          position,
          isDefault,
        ],
      );
      await setVariantPrimaryStock(client, variant.id, defaultWarehouse, variant.stock, p.slug);
    } else {
      const newId = await createVariantWithInventory(client, productId, p, variant, position, isDefault);
      keepIds.add(newId);
    }
  }

  for (const row of existing) {
    if (!keepIds.has(row.id)) {
      await client.query(`DELETE FROM product_variants WHERE id = $1`, [row.id]);
    }
  }
}

export async function createProductInDb(rawBody) {
  if (!isDatabaseConfigured()) {
    const err = new Error("Database not configured");
    err.status = 503;
    throw err;
  }

  const p = normalizeAdminProductBody(rawBody);
  if (!p.name?.trim()) {
    const err = new Error("Product name is required");
    err.status = 400;
    throw err;
  }

  const existing = await query(`SELECT id FROM products WHERE slug = $1`, [p.slug]);
  if (existing.rows.length > 0) {
    const err = new Error("Product slug already exists");
    err.status = 409;
    throw err;
  }

  return withTransaction(async (client) => {
    const collectionId = await upsertCollection(client, {
      slug: p.collectionSlug,
      name: p.collection,
    });

    const defaultWarehouse = mapOriginToWarehouse(p.origin);
    const { rows } = await client.query(
      `INSERT INTO products (
         slug, name, story, collection_id, subcategory, category, product_type,
         price_eur, compare_at_eur, price_usd, price_idr, status, featured, origin, default_warehouse
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id`,
      [
        p.slug,
        p.name,
        p.story,
        collectionId,
        p.subcategory,
        p.category,
        p.productType,
        p.priceEUR,
        p.compareAtEUR,
        p.priceUSD,
        p.priceIDR,
        p.status,
        p.featured,
        p.origin,
        defaultWarehouse,
      ],
    );

    const productId = rows[0].id;
    await replaceImages(client, productId, p.images);
    for (let i = 0; i < p.variants.length; i++) {
      await createVariantWithInventory(client, productId, p, p.variants[i], i, i === 0);
    }

    return productId;
  });
}

export async function updateProductInDb(currentSlug, rawBody) {
  if (!isDatabaseConfigured()) {
    const err = new Error("Database not configured");
    err.status = 503;
    throw err;
  }

  const p = normalizeAdminProductBody({ ...rawBody, slug: rawBody.slug || currentSlug });

  return withTransaction(async (client) => {
    const { rows: existingRows } = await client.query(
      `SELECT id, slug FROM products WHERE slug = $1`,
      [currentSlug],
    );
    if (existingRows.length === 0) {
      const err = new Error("Product not found");
      err.status = 404;
      throw err;
    }

    const productId = existingRows[0].id;

    if (p.slug !== currentSlug) {
      const conflict = await client.query(`SELECT id FROM products WHERE slug = $1 AND id != $2`, [
        p.slug,
        productId,
      ]);
      if (conflict.rows.length > 0) {
        const err = new Error("Product slug already exists");
        err.status = 409;
        throw err;
      }
    }

    const collectionId = await upsertCollection(client, {
      slug: p.collectionSlug,
      name: p.collection,
    });

    const defaultWarehouse = mapOriginToWarehouse(p.origin);

    await client.query(
      `UPDATE products SET
         slug = $2,
         name = $3,
         story = $4,
         collection_id = $5,
         subcategory = $6,
         category = $7,
         product_type = $8,
         price_eur = $9,
         compare_at_eur = $10,
         price_usd = $11,
         price_idr = $12,
         status = $13,
         featured = $14,
         origin = $15,
         default_warehouse = $16,
         updated_at = now()
       WHERE id = $1`,
      [
        productId,
        p.slug,
        p.name,
        p.story,
        collectionId,
        p.subcategory,
        p.category,
        p.productType,
        p.priceEUR,
        p.compareAtEUR,
        p.priceUSD,
        p.priceIDR,
        p.status,
        p.featured,
        p.origin,
        defaultWarehouse,
      ],
    );

    await replaceImages(client, productId, p.images);
    await syncProductVariants(client, productId, p);

    return productId;
  });
}

export async function deleteProductInDb(slug) {
  if (!isDatabaseConfigured()) {
    const err = new Error("Database not configured");
    err.status = 503;
    throw err;
  }

  const { rows } = await query(`DELETE FROM products WHERE slug = $1 RETURNING id`, [slug]);
  if (rows.length === 0) {
    const err = new Error("Product not found");
    err.status = 404;
    throw err;
  }
  return { ok: true, id: rows[0].id };
}

export async function findProductBySlug(slug) {
  const { rows } = await query(`SELECT id, slug FROM products WHERE slug = $1`, [slug]);
  return rows[0] ?? null;
}
