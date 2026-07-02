import { query, isDatabaseConfigured } from "./pool.mjs";

const VALID_TYPES = new Set(["view", "cart", "wishlist"]);

export async function recordProductEvent(productSlug, eventType) {
  if (!isDatabaseConfigured()) return { ok: false, reason: "no_db" };
  const slug = productSlug?.trim().toLowerCase();
  const type = eventType?.trim().toLowerCase();
  if (!slug || !VALID_TYPES.has(type)) {
    const err = new Error("Invalid product analytics event");
    err.status = 400;
    throw err;
  }
  await query(
    `INSERT INTO product_analytics_events (product_slug, event_type) VALUES ($1, $2)`,
    [slug, type],
  );
  return { ok: true };
}

export async function getProductAnalyticsSummary({ days = 30, limit = 50 } = {}) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for product analytics");
    err.status = 503;
    throw err;
  }
  const windowDays = Math.min(365, Math.max(1, Number(days) || 30));
  const maxRows = Math.min(200, Math.max(1, Number(limit) || 50));

  const { rows } = await query(
    `SELECT
       product_slug AS slug,
       COUNT(*) FILTER (WHERE event_type = 'view')::int AS views,
       COUNT(*) FILTER (WHERE event_type = 'cart')::int AS cart_adds,
       COUNT(*) FILTER (WHERE event_type = 'wishlist')::int AS wishlist_adds
     FROM product_analytics_events
     WHERE created_at >= now() - ($1::text || ' days')::interval
     GROUP BY product_slug
     ORDER BY views DESC, cart_adds DESC, wishlist_adds DESC
     LIMIT $2`,
    [String(windowDays), maxRows],
  );

  return {
    days: windowDays,
    products: rows.map((r) => ({
      slug: r.slug,
      views: r.views ?? 0,
      cartAdds: r.cart_adds ?? 0,
      wishlistAdds: r.wishlist_adds ?? 0,
    })),
  };
}
