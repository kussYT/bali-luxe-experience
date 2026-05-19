import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG_PATHS = [
  path.join(ROOT, "data", "catalog.json"),
  path.join(ROOT, "public", "catalog.json"),
  path.join(ROOT, "src", "data", "catalog.json"),
];

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function deriveCollections(products) {
  const map = new Map();
  for (const p of products) {
    if (!map.has(p.collectionSlug)) {
      map.set(p.collectionSlug, { slug: p.collectionSlug, name: p.collection, season: "" });
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeProduct(raw) {
  const priceEUR = Number(raw.priceEUR) || 0;
  const compareAtEUR =
    raw.compareAtEUR != null && raw.compareAtEUR !== ""
      ? Number(raw.compareAtEUR)
      : undefined;
  // compareAtEUR = optional promo price (lower than list price)
  const onSale = compareAtEUR != null && compareAtEUR < priceEUR;
  const stock = Number(raw.stock ?? (raw.available === false ? 0 : 1));
  const status = raw.status === "draft" ? "draft" : "published";
  const images = Array.isArray(raw.images) && raw.images.length > 0 ? raw.images : [raw.image].filter(Boolean);

  return {
    slug: raw.slug || slugify(raw.name || "product"),
    name: raw.name || "Untitled",
    story: raw.story || "",
    collection: raw.collection || "Shop",
    collectionSlug: raw.collectionSlug || slugify(raw.collection || "shop"),
    subcategory: raw.subcategory || "",
    category: raw.category || "hats",
    productType: raw.productType || "",
    priceEUR,
    compareAtEUR: onSale ? compareAtEUR : undefined,
    priceUSD: Number(raw.priceUSD) || Math.round(priceEUR * 1.1),
    priceIDR: Number(raw.priceIDR) || Math.round(priceEUR * 17_000),
    image: images[0] || "/shopify-import/placeholder.jpg",
    images,
    details: Array.isArray(raw.details) ? raw.details : [],
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    stock,
    status,
    featured: Boolean(raw.featured),
    onSale,
    available: stock > 0 && status === "published",
    origin: raw.origin === "France" ? "France" : "Bali",
  };
}

export function normalizeCatalog(raw) {
  const products = (raw.products || []).map(normalizeProduct);
  const collections = raw.collections?.length ? raw.collections : deriveCollections(products);
  return {
    generatedAt: new Date().toISOString(),
    store: raw.store || "https://bingindiaries.com",
    productCount: products.length,
    collections,
    products,
  };
}

export async function readCatalog() {
  for (const filePath of CATALOG_PATHS) {
    try {
      const raw = JSON.parse(await readFile(filePath, "utf8"));
      return normalizeCatalog(raw);
    } catch {
      // try next path
    }
  }
  throw new Error("Catalog file not found. Run npm run catalog:import first.");
}

export async function writeCatalog(catalog) {
  const normalized = normalizeCatalog(catalog);
  const json = JSON.stringify(normalized, null, 2);
  await mkdir(path.dirname(CATALOG_PATHS[0]), { recursive: true });
  await Promise.all(CATALOG_PATHS.map((p) => writeFile(p, json, "utf8")));
  return normalized;
}

export async function saveUploadedImage(slug, filename, buffer) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const dir = path.join(ROOT, "public", "uploads", "products", slug);
  await mkdir(dir, { recursive: true });
  const dest = path.join(dir, safeName);
  await writeFile(dest, buffer);
  return `/uploads/products/${slug}/${safeName}`;
}

export { slugify, deriveCollections, CATALOG_PATHS, ROOT };
