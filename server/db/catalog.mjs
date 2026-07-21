import { queryTransaction, isDatabaseConfigured } from "./pool.mjs";
import { resolveProductLocaleBlock, resolveCollectionLocaleBlock } from "../i18n-locales.mjs";
import { collectionsCatalogInsertStatement } from "../collections-catalog.mjs";

/** Postgres NUMERIC often arrives as string — normalize for JSON/API consumers. */
function moneyFromDb(value) {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.round(n * 100) / 100;
}

function buildProductSearchTags({ name, slug, story, productType, subcategory, collection, collectionSlugs = [] }) {
  const raw = [name, slug, story, productType, subcategory, collection, ...collectionSlugs]
    .filter(Boolean)
    .join(" ");
  const words = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((word) => word.length > 1);
  return [...new Set(words)];
}

function parseProductLocales(raw) {
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

function parseCollectionLocales(raw) {
  return parseProductLocales(raw);
}

function resolveCollectionFields(row, locale, { includeLocales = false } = {}) {
  const locales = parseCollectionLocales(row.locales);
  const resolved = locale ? resolveCollectionLocaleBlock(locales, locale) : null;
  const name = resolved?.block?.name?.trim() || row.name;
  const description = resolved?.block?.description?.trim() || row.description || "";
  const out = {
    slug: row.slug,
    name: includeLocales ? row.name : name,
    season: row.season || "",
    description: includeLocales ? row.description || "" : description,
    sortOrder: row.sort_order ?? 0,
    hidden: Boolean(row.hidden),
  };
  if (includeLocales) out.locales = locales;
  return out;
}

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
export async function fetchCatalogFromDb({ includeDrafts = false, locale, includeLocales = false } = {}) {
  if (!isDatabaseConfigured()) {
    const err = new Error("Database not configured");
    err.status = 503;
    throw err;
  }

  const statusFilter = includeDrafts ? "" : "WHERE p.status = 'published'";
  const productScope = `
    SELECT p.id FROM products p
    LEFT JOIN collections c ON c.id = p.collection_id
    ${statusFilter}
  `;

  const statements = [];
  if (includeDrafts) {
    statements.push(collectionsCatalogInsertStatement());
  }
  statements.push(
    {
      text: `SELECT slug, name, season, description, sort_order, COALESCE(hidden, false) AS hidden, locales
             FROM collections
             ORDER BY sort_order ASC, name ASC`,
      params: [],
    },
    {
      text: `
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
        p.video_url,
        p.seo_title,
        p.meta_description,
        p.sort_order,
        p.locales,
        c.slug AS collection_slug,
        c.name AS collection_name
      FROM products p
      LEFT JOIN collections c ON c.id = p.collection_id
      ${statusFilter}
      ORDER BY p.sort_order ASC, p.name ASC
      `,
      params: [],
    },
    {
      text: `SELECT product_id, url, position, focal_x, focal_y FROM product_images
             WHERE product_id IN (${productScope})
             ORDER BY position ASC`,
      params: [],
    },
    {
      text: `SELECT pcm.product_id, c.slug
             FROM product_collection_memberships pcm
             JOIN collections c ON c.id = pcm.collection_id
             WHERE pcm.product_id IN (${productScope})`,
      params: [],
    },
    {
      text: `SELECT
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
               v.position,
               vi.warehouse_id,
               vi.quantity,
               vi.reserved
             FROM product_variants v
             LEFT JOIN product_inventory vi ON vi.variant_id = v.id
             WHERE v.product_id IN (${productScope})
             ORDER BY v.position ASC, v.title ASC`,
      params: [],
    },
  );

  const catalogBatch = await queryTransaction(statements);
  const offset = includeDrafts ? 1 : 0;
  const collectionRows = catalogBatch[offset].rows;
  const productRows = catalogBatch[offset + 1].rows;
  const imageRows = catalogBatch[offset + 2].rows;
  const membershipRows = catalogBatch[offset + 3].rows;
  const variantInvRows = catalogBatch[offset + 4].rows;

  const visibleCollections = includeDrafts
    ? collectionRows
    : collectionRows.filter((c) => !c.hidden);

  const collectionBySlug = new Map(
    collectionRows.map((row) => [row.slug, resolveCollectionFields(row, locale, { includeLocales })]),
  );

  if (productRows.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      store: "https://bingindiaries.com",
      productCount: 0,
      collections: visibleCollections.map((c) =>
        resolveCollectionFields(c, locale, { includeLocales }),
      ),
      products: [],
      source: "postgres",
    };
  }

  const imagesByProduct = new Map();
  const imageFocalsByProduct = new Map();
  const focalByProduct = new Map();
  for (const img of imageRows) {
    if (!imagesByProduct.has(img.product_id)) {
      imagesByProduct.set(img.product_id, []);
      imageFocalsByProduct.set(img.product_id, []);
    }
    imagesByProduct.get(img.product_id).push(img.url);
    imageFocalsByProduct.get(img.product_id).push({
      x: Number(img.focal_x) || 50,
      y: Number(img.focal_y) || 50,
    });
    if (img.position === 0) {
      focalByProduct.set(img.product_id, {
        x: Number(img.focal_x) || 50,
        y: Number(img.focal_y) || 50,
      });
    }
  }

  const extraCollectionsByProduct = new Map();
  for (const row of membershipRows) {
    if (!extraCollectionsByProduct.has(row.product_id)) {
      extraCollectionsByProduct.set(row.product_id, []);
    }
    extraCollectionsByProduct.get(row.product_id).push(row.slug);
  }

  const inventoryByVariant = new Map();
  for (const row of variantInvRows) {
    if (row.warehouse_id) {
      if (!inventoryByVariant.has(row.id)) {
        inventoryByVariant.set(row.id, { france: 0, bali: 0 });
      }
      const bucket = inventoryByVariant.get(row.id);
      bucket[row.warehouse_id] = Math.max(0, (row.quantity ?? 0) - (row.reserved ?? 0));
    }
  }

  const variantsByProduct = new Map();
  const seenVariantIds = new Set();
  for (const row of variantInvRows) {
    if (seenVariantIds.has(row.id)) continue;
    seenVariantIds.add(row.id);
    if (!variantsByProduct.has(row.product_id)) variantsByProduct.set(row.product_id, []);
    const inv = inventoryByVariant.get(row.id) || { france: 0, bali: 0 };
    const available = inv.france + inv.bali > 0;
    variantsByProduct.get(row.product_id).push({
      id: row.id,
      slug: row.slug,
      sku: row.sku || undefined,
      title: row.title,
      option1: row.option1 || undefined,
      option2: row.option2 || undefined,
      option3: row.option3 || undefined,
      priceEUR: moneyFromDb(row.price_eur),
      compareAtEUR: moneyFromDb(row.compare_at_eur),
      isDefault: row.is_default,
      inventory: inv,
      available,
    });
  }

  const products = productRows.map((p) => {
    const images = imagesByProduct.get(p.id) || [];
    const imageFocals = imageFocalsByProduct.get(p.id) || [];
    const focal = focalByProduct.get(p.id) || imageFocals[0] || { x: 50, y: 50 };
    const variants = variantsByProduct.get(p.id) || [];
    const stockFrance = variants.reduce((s, v) => s + v.inventory.france, 0);
    const stockBali = variants.reduce((s, v) => s + v.inventory.bali, 0);
    const stock = stockFrance + stockBali;
    const priceEUR = moneyFromDb(p.price_eur) ?? 0;
    const compareRaw = moneyFromDb(p.compare_at_eur);
    const onSale = compareRaw != null && compareRaw < priceEUR;
    const available = stock > 0 && p.status === "published";
    const extraSlugs = extraCollectionsByProduct.get(p.id) ?? [];
    const primarySlug = p.collection_slug || "shop";
    const primaryCollection = collectionBySlug.get(primarySlug);
    const locales = parseProductLocales(p.locales);
    const resolved = locale ? resolveProductLocaleBlock(locales, locale) : null;
    const name = resolved?.block?.name?.trim() || p.name;
    const story = resolved?.block?.story?.trim() || p.story;
    const seoTitle = resolved?.block?.seoTitle?.trim() || p.seo_title?.trim() || name;
    const metaDescription = resolved?.block?.metaDescription?.trim() || p.meta_description?.trim() || "";

    const product = {
      id: p.id,
      slug: p.slug,
      name: includeLocales ? p.name : name,
      story: includeLocales ? p.story : story,
      collection: primaryCollection?.name || p.collection_name || "Shop",
      collectionSlug: primarySlug,
      collectionSlugs: extraSlugs.length > 0 ? extraSlugs : undefined,
      subcategory: p.subcategory,
      category: p.category,
      productType: p.product_type,
      priceEUR,
      compareAtEUR: onSale ? compareRaw : undefined,
      priceUSD: p.price_usd,
      priceIDR: p.price_idr,
      image: images[0] || "/shopify-import/placeholder.jpg",
      images,
      imageFocal: focal,
      imageFocals: imageFocals.length ? imageFocals : undefined,
      videoUrl: p.video_url || undefined,
      seoTitle: includeLocales ? p.seo_title?.trim() || undefined : seoTitle || undefined,
      metaDescription: includeLocales ? p.meta_description?.trim() || undefined : metaDescription || undefined,
      details: p.product_type ? [p.product_type] : [],
      tags: buildProductSearchTags({
        name: p.name,
        slug: p.slug,
        story: p.story,
        productType: p.product_type,
        subcategory: p.subcategory,
        collection: primaryCollection?.name || p.collection_name || "Shop",
        collectionSlugs: extraSlugs.length > 0 ? [primarySlug, ...extraSlugs] : [primarySlug],
      }),
      stock,
      stockFrance,
      stockBali,
      status: p.status,
      featured: p.featured,
      sortOrder: p.sort_order ?? 0,
      onSale,
      available,
      origin: p.origin,
      defaultWarehouse: p.default_warehouse,
      variants,
    };

    product.locales = locales;
    return product;
  });

  return {
    generatedAt: new Date().toISOString(),
    store: "https://bingindiaries.com",
    productCount: products.length,
    collections: visibleCollections.map((c) => resolveCollectionFields(c, locale, { includeLocales })),
    products,
    source: "postgres",
  };
}

export { mapOriginToWarehouse, buildVariantSlug };
