/**
 * Shared Shopify public-API sync (no Admin token).
 * Source: https://bingindiaries.com
 */
import { readFile } from "node:fs/promises";

export const SHOPIFY_STORE = "https://bingindiaries.com";

/** Collections used only for merchandising — not as a product's primary line. */
const SECONDARY_COLLECTION_HANDLES = new Set([
  "all-products",
  "best-sellers",
  "archives",
  "juicy-record",
]);

export function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractParagraphs(html) {
  if (!html) return [];
  const paras = [];
  const re = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(html))) {
    const text = stripHtml(m[1]);
    if (text.length > 15) paras.push(text);
  }
  return paras.length ? paras : htmlToParagraphs(html);
}

export function htmlToParagraphs(html) {
  if (!html) return [];
  const chunks = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .split(/\n+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return chunks;
}

export function extractImages(html) {
  if (!html) return [];
  const urls = [];
  const re = /<img[^>]+src=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) urls.push(m[1]);
  return urls;
}

export function extractYoutubeId(html) {
  const m = html?.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  return m?.[1] ?? null;
}

/** Shopify: price = sale, compare_at_price = original (higher). */
export function mapShopifyVariantPricing(variant) {
  const sale = variant ? Math.round(parseFloat(variant.price)) : 0;
  const compareRaw = variant?.compare_at_price ? parseFloat(variant.compare_at_price) : null;
  const original = compareRaw != null ? Math.round(compareRaw) : sale;
  const onSale = compareRaw != null && compareRaw > parseFloat(variant.price);
  return {
    priceEUR: onSale ? original : sale,
    compareAtEUR: onSale ? sale : undefined,
    onSale,
    available: variant?.available !== false,
  };
}

export function pickPrimaryCollection(memberships) {
  if (!memberships?.length) return null;
  const primary = memberships.find((c) => !SECONDARY_COLLECTION_HANDLES.has(c.handle));
  return primary ?? memberships[0];
}

export async function fetchJson(path) {
  const res = await fetch(`${SHOPIFY_STORE}${path}`);
  if (!res.ok) throw new Error(`Shopify ${path} → ${res.status}`);
  return res.json();
}

export async function loadShopifySnapshot() {
  const [{ pages }, { collections }, { products }] = await Promise.all([
    fetchJson("/pages.json?limit=50"),
    fetchJson("/collections.json?limit=50"),
    fetchJson("/products.json?limit=250"),
  ]);

  const collectionProducts = new Map();
  const productMembership = new Map();

  for (const col of collections) {
    if (col.handle === "all-products") continue;
    try {
      const { products: colProducts } = await fetchJson(
        `/collections/${col.handle}/products.json?limit=250`,
      );
      collectionProducts.set(col.handle, colProducts ?? []);
      for (const p of colProducts ?? []) {
        if (!productMembership.has(p.handle)) productMembership.set(p.handle, []);
        productMembership.get(p.handle).push({
          handle: col.handle,
          title: col.title,
          description: stripHtml(col.description),
        });
      }
    } catch {
      collectionProducts.set(col.handle, []);
    }
  }

  const pagesByHandle = Object.fromEntries(pages.map((p) => [p.handle, p]));

  return {
    pages,
    pagesByHandle,
    collections,
    products,
    collectionProducts,
    productMembership,
  };
}

export function inferCategory(handle, title, productType) {
  const h = handle.toLowerCase();
  const t = title.toLowerCase();
  if (h.includes("earring") || t.includes("earring") || t.includes("comb") || t.includes("pin"))
    return "accessories";
  if (t.includes("bag") || t.includes("cabas")) return "bags";
  return "hats";
}

function buildTags(title, collection, productType, handle) {
  const words = `${title} ${collection} ${productType} ${handle}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return [...new Set(words)];
}

export async function buildCatalogFromShopify({ manifestPath }) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const manifestByHandle = Object.fromEntries(manifest.products.map((p) => [p.handle, p]));
  const snapshot = await loadShopifySnapshot();

  const catalogProducts = [];

  for (const sp of snapshot.products) {
    if (sp.handle === "gift-card") continue;

    const meta = manifestByHandle[sp.handle];
    if (!meta) continue;

    const images = meta.images
      .filter((img) => img.file)
      .map((img) => `/shopify-import/${sp.handle}/${img.file}`);
    if (images.length === 0) continue;

    const memberships = snapshot.productMembership.get(sp.handle) ?? [];
    const primary = pickPrimaryCollection(memberships);
    const inOutlet = memberships.some((c) => c.handle === "archives");

    const variant = sp.variants?.[0];
    const pricing = mapShopifyVariantPricing(variant);
    const body = stripHtml(sp.body_html);
    const story =
      body.length > 480 ? `${body.slice(0, 477)}…` : body || `${sp.title} — Bingin Diaries.`;

    const collectionName = primary?.title ?? "Shop";
    const collectionSlug = primary?.handle ?? "all-products";

    catalogProducts.push({
      slug: sp.handle,
      name: sp.title,
      collection: collectionName,
      collectionSlug,
      collectionSlugs: memberships.map((c) => c.handle),
      category: inferCategory(sp.handle, sp.title, sp.product_type),
      productType: sp.product_type || "",
      ...pricing,
      priceUSD: Math.round((pricing.compareAtEUR ?? pricing.priceEUR) * 1.1),
      priceIDR: Math.round((pricing.compareAtEUR ?? pricing.priceEUR) * 17_000),
      image: images[0],
      images,
      story,
      details: sp.product_type ? [sp.product_type] : [],
      tags: buildTags(sp.title, collectionName, sp.product_type, sp.handle),
      outlet: inOutlet,
      featured: memberships.some((c) => c.handle === "best-sellers"),
      status: "published",
      stock: variant?.inventory_quantity ?? 1,
      origin: sp.tags?.includes("France") || collectionSlug === "galore-capsule-collection" ? "France" : "Bali",
    });
  }

  const collections = snapshot.collections
    .filter((c) => c.handle !== "all-products" && c.handle !== "gift-card")
    .map((c, i) => ({
      slug: c.handle,
      name: c.title,
      season: c.handle.includes("winter") || c.handle.includes("fall") ? "FW" : "",
      description: stripHtml(c.description),
      sortOrder: i,
    }));

  return {
    generatedAt: new Date().toISOString(),
    store: SHOPIFY_STORE,
    productCount: catalogProducts.length,
    collections,
    products: catalogProducts,
    snapshot: {
      saleCount: catalogProducts.filter((p) => p.onSale).length,
      outletCount: catalogProducts.filter((p) => p.outlet).length,
    },
  };
}

export function buildBrandContent(pagesByHandle) {
  const laMarque = pagesByHandle["la-marque"];
  const care = pagesByHandle["guide-dentretien"];
  const sizing = pagesByHandle["guide-des-tailles"];
  const shippingPage = pagesByHandle["livraison-retour"];

  const laMarqueParagraphs = extractParagraphs(laMarque?.body_html ?? "");
  const careSections = parseCareGuide(care?.body_html ?? "");
  const sizingImage = extractImages(sizing?.body_html ?? "")[0] ?? "";

  return {
    about: {
      eyebrow: "La marque",
      title: laMarque?.title?.trim() || "LA MARQUE",
      youtubeId: extractYoutubeId(laMarque?.body_html ?? ""),
      sections: [
        {
          id: "vision",
          eyebrow: "01 — Attitude",
          title: "Une attitude, une singularité",
          body: laMarqueParagraphs[0] ?? "",
        },
        {
          id: "artisans",
          eyebrow: "02 — Artisans",
          title: "Une marque juste & humaine",
          body: laMarqueParagraphs[1] ?? "",
        },
        {
          id: "quality",
          eyebrow: "03 — Matières",
          title: "Qualité, durabilité & éco-responsabilité",
          body: laMarqueParagraphs[2] ?? "",
        },
        {
          id: "france",
          eyebrow: "04 — France",
          title: "Dessinés & stockés en France",
          body: [laMarqueParagraphs[3], laMarqueParagraphs[4]].filter(Boolean).join(" "),
        },
      ],
      values: [
        { n: "01", t: "Artisans connus", d: "Bali & Portugal — une histoire derrière chaque pièce." },
        { n: "02", t: "Matières durables", d: "Vers des chapeaux de plus en plus éco-responsables." },
        { n: "03", t: "Slow fashion", d: "Collections singulières, mémorables, faites pour durer." },
      ],
    },
    care: {
      eyebrow: "Entretien",
      title: care?.title?.trim() || "Guide d'entretien",
      intro: careSections.intro,
      sections: careSections.sections,
    },
    sizing: {
      eyebrow: "Fit",
      title: sizing?.title?.trim() || "Guide des tailles",
      image: sizingImage,
      body: [
        "Most Bingin Diaries hats are adjustable with an interior ribbon (sizes M & L).",
        "Refer to the chart below for brim and crown measurements.",
      ],
    },
    shippingReturns: splitShippingReturns(shippingPage?.body_html ?? ""),
  };
}

function parseCareGuide(html) {
  const intro = stripHtml(html.split(/<p>\s*coton/i)[0] ?? html).slice(0, 220);
  const materialBlocks = [
    ["Coton", /coton<\/p>([\s\S]*?)(?=<p>\s*wool|<p>\s*Beanies|$)/i],
    ["Wool", /wool\s*<\/p>([\s\S]*?)(?=<p>\s*cashmere|<p>\s*Beanies|$)/i],
    ["Cashmere", /cashmere<\/p>([\s\S]*?)(?=<p>\s*Beanies|<p>\s*Caps|$)/i],
    ["Beanies", /Beanies\s*<\/p>([\s\S]*?)(?=<p>\s*Caps|<p>\s*Le bucket|$)/i],
    ["Caps", /Caps<\/p>([\s\S]*?)(?=<p>\s*Le bucket|$)/i],
    ["Le bucket / radio soleil", /Le bucket[\s\S]*?<\/p>([\s\S]*?)(?=<p>\s*General|$)/i],
  ];

  const sections = [];
  for (const [title, re] of materialBlocks) {
    const m = html.match(re);
    if (!m) continue;
    const tips = htmlToParagraphs(m[1]).filter((l) => l.startsWith("•") || l.length < 120);
    if (tips.length) sections.push({ title, tips });
  }

  const general = html.match(/General tip:([\s\S]*?)$/i);
  if (general) {
    sections.push({
      title: "General",
      tips: [stripHtml(general[0])],
    });
  }

  return { intro, sections };
}

function splitShippingReturns(html) {
  const paragraphs = htmlToParagraphs(html);
  const deliveryIdx = paragraphs.findIndex((p) => /^LIVRAISON/i.test(p));
  const returnIdx = paragraphs.findIndex((p) => /^RETOUR/i.test(p));
  const soldesIdx = paragraphs.findIndex((p) => /^SOLDES/i.test(p));

  const shipping = paragraphs.slice(
    deliveryIdx >= 0 ? deliveryIdx : 1,
    returnIdx >= 0 ? returnIdx : soldesIdx >= 0 ? soldesIdx : paragraphs.length,
  );
  const returns = paragraphs.slice(
    returnIdx >= 0 ? returnIdx : soldesIdx >= 0 ? soldesIdx : Math.floor(paragraphs.length / 2),
  );

  return {
    shipping: {
      title: "Livraisons",
      eyebrow: "Customer care",
      body: shipping.length ? shipping : paragraphs.slice(0, 6),
    },
    returns: {
      title: "Livraisons & retours",
      eyebrow: "Customer care",
      body: returns.length ? returns : paragraphs.slice(6),
    },
  };
}
