import { query, isDatabaseConfigured, withTransaction } from "./pool.mjs";

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
  };
}

export async function listCollectionsAdmin() {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for collections admin");
    err.status = 503;
    throw err;
  }
  const { rows } = await query(
    `
    SELECT c.slug, c.name, c.season, c.description, c.hero_image, c.sort_order, c.hidden, c.updated_at,
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
  const { rows } = await query(
    `UPDATE collections SET
       name = COALESCE($2, name),
       season = COALESCE($3, season),
       description = COALESCE($4, description),
       hero_image = COALESCE($5, hero_image),
       sort_order = COALESCE($6, sort_order),
       hidden = COALESCE($7, hidden),
       updated_at = now()
     WHERE slug = $1
     RETURNING slug, name, season, description, hero_image, sort_order, hidden, updated_at`,
    [
      slug,
      patch.name ?? null,
      patch.season ?? null,
      patch.description ?? null,
      patch.heroImage ?? null,
      patch.sortOrder != null ? Number(patch.sortOrder) : null,
      patch.hidden != null ? Boolean(patch.hidden) : null,
    ],
  );
  if (!rows.length) {
    const err = new Error("Collection not found");
    err.status = 404;
    throw err;
  }
  const { rows: withCount } = await query(
    `SELECT c.slug, c.name, c.season, c.description, c.hero_image, c.sort_order, c.hidden, c.updated_at,
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
