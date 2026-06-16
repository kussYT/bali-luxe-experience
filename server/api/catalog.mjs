import { isDatabaseConfigured } from "../db/pool.mjs";
import { fetchCatalogFromDb } from "../db/catalog.mjs";
import { readCatalog } from "../catalog-store.mjs";

/**
 * Production catalog handler — Postgres first, JSON fallback for local dev without DB.
 */
export async function getCatalogResponse({ includeDrafts = false } = {}) {
  if (isDatabaseConfigured()) {
    return fetchCatalogFromDb({ includeDrafts });
  }
  const catalog = await readCatalog();
  const products = includeDrafts
    ? catalog.products
    : catalog.products.filter((p) => p.status === "published");
  return {
    ...catalog,
    products,
    productCount: products.length,
    source: "json-fallback",
  };
}
