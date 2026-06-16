import { getCatalogResponse } from "./catalog.mjs";
import {
  createProductInDb,
  updateProductInDb,
  deleteProductInDb,
  normalizeAdminProductBody,
} from "../db/products-admin.mjs";
import { fetchCatalogFromDb } from "../db/catalog.mjs";

async function productFromCatalog(slug) {
  const catalog = await fetchCatalogFromDb({ includeDrafts: true });
  return catalog.products.find((p) => p.slug === slug) ?? null;
}

export async function createAdminProduct(body) {
  const normalized = normalizeAdminProductBody(body);
  await createProductInDb(body);
  const product = await productFromCatalog(normalized.slug);
  const catalog = await getCatalogResponse({ includeDrafts: true });
  return { product, catalog };
}

export async function updateAdminProduct(currentSlug, body) {
  const normalized = normalizeAdminProductBody({ ...body, slug: body.slug || currentSlug });
  await updateProductInDb(currentSlug, body);
  const product = await productFromCatalog(normalized.slug);
  const catalog = await getCatalogResponse({ includeDrafts: true });
  return { product, catalog };
}

export async function deleteAdminProduct(slug) {
  await deleteProductInDb(slug);
  const catalog = await getCatalogResponse({ includeDrafts: true });
  return { ok: true, catalog };
}
