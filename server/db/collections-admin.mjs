import { query, isDatabaseConfigured, withTransaction } from "./pool.mjs";
import { ensureCollectionsCatalog } from "../collections-catalog.mjs";
import { invalidateCache } from "./request-cache.mjs";

function parseLocales(raw) {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof raw === "object" ? raw : {};
}

function mapCollection(row) {
  return {
    slug: row.slug,
    name: row.name,
    season: row.season || "",
    description: row.description || "",
    heroImage: row.hero_image || "",
    sortOrder: row.sort_order ?? 0,
    hidden: Boolean(row.hidden),
    productCount: Number(row.product_count) || 0,
    updatedAt: row.updated_at,
    locales: parseLocales(row.locales),
  };
}

export async function listCollectionsAdmin() {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for collections admin");
    err.status = 503;
    throw err;
  }
  await ensureCollectionsCatalog((sql, params) => query(sql, params));
  const { rows } = await query(
    `
    SELECT c.slug, c.name, c.season, c.description, c.hero_image, c.sort_order, c.hidden, c.updated_at, c.locales,
           COUNT(p.id)::int AS product_count
    FROM collections c
    LEFT JOIN products p ON p.collection_id = c.id
    GROUP BY c.id
    ORDER BY c.sort_order ASC, c.name ASC
    `,
  );
  return rows.map(mapCollection);
}

export async function updateCollection(slug, patch) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for collections admin");
    err.status = 503;
    throw err;
  }
  const localesJson =
    patch.locales != null && typeof patch.locales === "object"
      ? JSON.stringify(patch.locales)
      : null;
  const { rows } = await query(
    `UPDATE collections SET
       name = COALESCE($2, name),
       season = COALESCE($3, season),
       description = COALESCE($4, description),
       hero_image = COALESCE($5, hero_image),
       sort_order = COALESCE($6, sort_order),
       hidden = COALESCE($7, hidden),
       locales = COALESCE($8::jsonb, locales),
       updated_at = now()
     WHERE slug = $1
     RETURNING slug, name, season, description, hero_image, sort_order, hidden, updated_at, locales`,
    [
      slug,
      patch.name ?? null,
      patch.season ?? null,
      patch.description ?? null,
      patch.heroImage ?? null,
      patch.sortOrder != null ? Number(patch.sortOrder) : null,
      patch.hidden != null ? Boolean(patch.hidden) : null,
      localesJson,
    ],
  );
  if (!rows.length) {
    const err = new Error("Collection not found");
    err.status = 404;
    throw err;
  }
  invalidateCache("catalog:");
  const { rows: withCount } = await query(
    `SELECT c.slug, c.name, c.season, c.description, c.hero_image, c.sort_order, c.hidden, c.updated_at, c.locales,
            COUNT(p.id)::int AS product_count
     FROM collections c
     LEFT JOIN products p ON p.collection_id = c.id
     WHERE c.slug = $1
     GROUP BY c.id`,
    [slug],
  );
  return mapCollection(withCount[0]);
}

export async function reorderCollections(orders) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for collections admin");
    err.status = 503;
    throw err;
  }
  if (!Array.isArray(orders) || orders.length === 0) {
    const err = new Error("orders array required");
    err.status = 400;
    throw err;
  }
  await withTransaction(async (client) => {
    for (const item of orders) {
      if (!item?.slug) continue;
      await client.query(`UPDATE collections SET sort_order = $2, updated_at = now() WHERE slug = $1`, [
        item.slug,
        Number(item.sortOrder) || 0,
      ]);
    }
  });
  return listCollectionsAdmin();
}

export async function listCollectionProductSlugs(collectionSlug) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for collections admin");
    err.status = 503;
    throw err;
  }
  const { rows: colRows } = await query(`SELECT id FROM collections WHERE slug = $1`, [collectionSlug]);
  if (!colRows.length) {
    const err = new Error("Collection not found");
    err.status = 404;
    throw err;
  }
  const collectionId = colRows[0].id;
  const { rows } = await query(
    `
    SELECT DISTINCT p.slug, p.name, c.slug AS primary_slug
    FROM products p
    LEFT JOIN collections c ON c.id = p.collection_id
    LEFT JOIN product_collection_memberships pcm ON pcm.product_id = p.id
    WHERE p.collection_id = $1 OR pcm.collection_id = $1
    ORDER BY p.name ASC
    `,
    [collectionId],
  );
  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    isPrimary: r.primary_slug === collectionSlug,
  }));
}

async function getCollectionId(client, slug) {
  const { rows } = await client.query(`SELECT id FROM collections WHERE slug = $1`, [slug]);
  if (!rows.length) {
    const err = new Error("Collection not found");
    err.status = 404;
    throw err;
  }
  return rows[0].id;
}

async function getShopCollectionId(client) {
  const { rows } = await client.query(`SELECT id FROM collections WHERE slug = 'shop' LIMIT 1`);
  if (rows.length) return rows[0].id;
  const { rows: created } = await client.query(
    `INSERT INTO collections (slug, name, season) VALUES ('shop', 'Shop', '') RETURNING id`,
  );
  return created[0].id;
}

export async function patchCollectionProducts(collectionSlug, { add = [], remove = [] } = {}) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for collections admin");
    err.status = 503;
    throw err;
  }
  const addSlugs = [...new Set((add || []).map((s) => String(s).trim()).filter(Boolean))];
  const removeSlugs = [...new Set((remove || []).map((s) => String(s).trim()).filter(Boolean))];

  await withTransaction(async (client) => {
    const collectionId = await getCollectionId(client, collectionSlug);
    const shopId = await getShopCollectionId(client);

    for (const productSlug of addSlugs) {
      const { rows: products } = await client.query(`SELECT id, collection_id FROM products WHERE slug = $1`, [
        productSlug,
      ]);
      if (!products.length) continue;
      const productId = products[0].id;
      if (products[0].collection_id === collectionId) continue;

      const { rows: membership } = await client.query(
        `SELECT 1 FROM product_collection_memberships WHERE product_id = $1 AND collection_id = $2`,
        [productId, collectionId],
      );
      if (membership.length) continue;

      if (!products[0].collection_id || products[0].collection_id === shopId) {
        await client.query(`UPDATE products SET collection_id = $2, updated_at = now() WHERE id = $1`, [
          productId,
          collectionId,
        ]);
      } else {
        await client.query(
          `INSERT INTO product_collection_memberships (product_id, collection_id) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [productId, collectionId],
        );
      }
    }

    for (const productSlug of removeSlugs) {
      const { rows: products } = await client.query(`SELECT id, collection_id FROM products WHERE slug = $1`, [
        productSlug,
      ]);
      if (!products.length) continue;
      const productId = products[0].id;

      if (products[0].collection_id === collectionId) {
        await client.query(`UPDATE products SET collection_id = $2, updated_at = now() WHERE id = $1`, [
          productId,
          shopId,
        ]);
      }

      await client.query(
        `DELETE FROM product_collection_memberships WHERE product_id = $1 AND collection_id = $2`,
        [productId, collectionId],
      );
    }
  });

  return listCollectionProductSlugs(collectionSlug);
}
