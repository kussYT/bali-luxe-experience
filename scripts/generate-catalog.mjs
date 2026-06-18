import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCatalogFromShopify } from "../server/shopify-sync.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = path.join(ROOT, "public", "shopify-import", "manifest.json");
const OUT_PATHS = [
  path.join(ROOT, "src", "data", "catalog.json"),
  path.join(ROOT, "data", "catalog.json"),
  path.join(ROOT, "public", "catalog.json"),
];

async function main() {
  const catalog = await buildCatalogFromShopify({ manifestPath: MANIFEST });
  const json = `${JSON.stringify(catalog, null, 2)}\n`;
  await Promise.all(OUT_PATHS.map(async (out) => {
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, json, "utf8");
  }));
  console.log(
    `Wrote ${catalog.productCount} products, ${catalog.collections.length} collections (${catalog.snapshot.saleCount} on sale)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
