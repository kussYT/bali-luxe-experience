import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = path.join(ROOT, "public", "shopify-import", "manifest.json");
const OUT = path.join(ROOT, "src", "data", "catalog.json");
const STORE = "https://bingindiaries.com";

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function inferCollection(handle, title, productType) {
  const h = handle.toLowerCase();
  const t = title.toLowerCase();
  if (h === "gift-card") return { slug: "gift-card", name: "Gift card" };
  if (h.includes("fisherman") || t.includes("fisherman"))
    return { slug: "90s-fisher", name: "90's Fisherman" };
  if (h.includes("rimba") || t.includes("rimba")) return { slug: "the-rimba", name: "The Rimba" };
  if (h.includes("bucket") || t.includes("bucket")) return { slug: "bucket-hat", name: "Bucket Hat" };
  if (h.includes("cow-boy") || h.includes("cowboy") || t.includes("cow-boy"))
    return { slug: "cow-boy", name: "Cow-boy" };
  if (h.includes("galore")) return { slug: "galore-capsule-collection", name: "Galore" };
  if (h.includes("boater")) return { slug: "boater", name: "Boater" };
  if (h.includes("cap") || productType === "Cap") return { slug: "casquette", name: "Casquette" };
  if (h.includes("beanie") || t.includes("beanie") || h.includes("winter-beanie"))
    return { slug: "the-knits", name: "The knits" };
  if (h.includes("earring") || t.includes("earring"))
    return { slug: "accessories", name: "Accessories" };
  if (productType === "Hats" || t.includes("hat")) return { slug: "all-products", name: "Hats" };
  return { slug: "all-products", name: "Shop" };
}

function inferCategory(handle, title, productType) {
  const h = handle.toLowerCase();
  const t = title.toLowerCase();
  if (h.includes("earring") || t.includes("earring")) return "accessories";
  if (t.includes("bag")) return "bags";
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

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  const manifestByHandle = Object.fromEntries(manifest.products.map((p) => [p.handle, p]));

  console.log("Fetching live product data…");
  const res = await fetch(`${STORE}/products.json?limit=250`);
  const { products: shopifyProducts } = await res.json();

  const catalogProducts = [];

  for (const sp of shopifyProducts) {
    if (sp.handle === "gift-card") continue;

    const meta = manifestByHandle[sp.handle];
    if (!meta) {
      console.warn(`  skip (no images): ${sp.handle}`);
      continue;
    }

    const variant = sp.variants?.[0];
    const priceEUR = variant ? Math.round(parseFloat(variant.price)) : 0;
    const compare = variant?.compare_at_price ? parseFloat(variant.compare_at_price) : null;
    const onSale = compare != null && compare > priceEUR;

    const images = meta.images
      .filter((img) => img.file)
      .map((img) => `/shopify-import/${sp.handle}/${img.file}`);

    if (images.length === 0) continue;

    const collection = inferCollection(sp.handle, sp.title, sp.product_type);
    const body = stripHtml(sp.body_html);
    const story =
      body.length > 320 ? `${body.slice(0, 317)}…` : body || `${sp.title} — Bingin Diaries.`;

    catalogProducts.push({
      slug: sp.handle,
      name: sp.title,
      collection: collection.name,
      collectionSlug: collection.slug,
      category: inferCategory(sp.handle, sp.title, sp.product_type),
      productType: sp.product_type || "",
      priceEUR,
      priceUSD: Math.round(priceEUR * 1.1),
      priceIDR: Math.round(priceEUR * 17_000),
      image: images[0],
      images,
      story,
      details: sp.product_type ? [sp.product_type] : [],
      tags: buildTags(sp.title, collection.name, sp.product_type, sp.handle),
      onSale,
      available: variant?.available !== false,
      origin: "Bali",
    });
  }

  const collectionMap = new Map();
  for (const p of catalogProducts) {
    if (!collectionMap.has(p.collectionSlug)) {
      collectionMap.set(p.collectionSlug, {
        slug: p.collectionSlug,
        name: p.collection,
        count: 0,
      });
    }
    collectionMap.get(p.collectionSlug).count++;
  }

  const collections = [...collectionMap.values()]
    .filter((c) => c.slug !== "gift-card" && c.count > 0)
    .sort((a, b) => b.count - a.count)
    .map(({ slug, name }) => ({ slug, name, season: "" }));

  const catalog = {
    generatedAt: new Date().toISOString(),
    store: STORE,
    productCount: catalogProducts.length,
    collections,
    products: catalogProducts,
  };

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(catalog, null, 2), "utf8");

  console.log(`Wrote ${catalogProducts.length} products, ${collections.length} collections → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
