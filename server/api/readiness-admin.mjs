import { fetchCatalogFromDb } from "../db/catalog.mjs";
import { isDatabaseConfigured } from "../db/pool.mjs";

export async function getAdminReadinessResponse() {
  let products = [];
  if (isDatabaseConfigured()) {
    const catalog = await fetchCatalogFromDb({ includeDrafts: true });
    products = catalog.products || [];
  } else {
    const { readCatalog } = await import("../catalog-store.mjs");
    const catalog = await readCatalog();
    products = catalog.products || [];
  }

  const issues = [];
  const ready = [];

  for (const p of products) {
    const problems = [];
    if (p.status !== "published") problems.push("brouillon");
    if (!p.image) problems.push("sans image");
    if (!p.variants?.length) problems.push("sans variante");
    const stock = (p.stockFrance ?? 0) + (p.stockBali ?? 0);
    if (stock <= 0) problems.push("stock à 0");

    const row = {
      slug: p.slug,
      name: p.name,
      status: p.status,
      collection: p.collectionSlug,
      stockFrance: p.stockFrance ?? 0,
      stockBali: p.stockBali ?? 0,
      hasImage: Boolean(p.image),
      variantCount: p.variants?.length ?? 0,
      problems,
    };

    if (problems.length === 0) ready.push(row);
    else issues.push(row);
  }

  return {
    summary: {
      total: products.length,
      published: products.filter((p) => p.status === "published").length,
      ready: ready.length,
      needsAttention: issues.length,
    },
    issues,
    ready,
    source: isDatabaseConfigured() ? "postgres" : "json",
  };
}
