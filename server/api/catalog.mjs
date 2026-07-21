import { isDatabaseConfigured } from "../db/pool.mjs";
import { fetchCatalogFromDb } from "../db/catalog.mjs";
import { readCatalog } from "../catalog-store.mjs";
import { getCached } from "../db/request-cache.mjs";
import { logQueryStats, resetQueryStats } from "../db/query-stats.mjs";

const PUBLIC_CATALOG_TTL_MS = 60_000;

function catalogCacheKey({ includeDrafts, locale, includeLocales }) {
  return `catalog:${includeDrafts ? "drafts" : "public"}:${locale || "default"}:${includeLocales ? "locales" : "flat"}`;
}

/**
 * Production catalog handler — Postgres first, JSON fallback for local dev without DB.
 */
export async function getCatalogResponse({ includeDrafts = false, locale, includeLocales = true } = {}) {
  resetQueryStats();

  if (isDatabaseConfigured()) {
    const ttl = includeDrafts ? 0 : PUBLIC_CATALOG_TTL_MS;
    const catalog = await getCached(catalogCacheKey({ includeDrafts, locale, includeLocales }), ttl, () =>
      fetchCatalogFromDb({ includeDrafts, locale, includeLocales }),
    );
    logQueryStats(includeDrafts ? "GET /api/catalog (drafts)" : "GET /api/catalog");
    return catalog;
  }

  const catalog = await readCatalog();
  const products = includeDrafts
    ? catalog.products
    : catalog.products.filter((p) => p.status === "published");
  logQueryStats("GET /api/catalog (json-fallback)");
  return {
    ...catalog,
    products,
    productCount: products.length,
    source: "json-fallback",
  };
}
