import { mkdir, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "shopify-import");
const STORE = "https://bingindiaries.com";

function extFromUrl(url) {
  const base = url.split("?")[0];
  const match = base.match(/\.(webp|jpe?g|png|gif|avif)$/i);
  return match ? match[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  await pipeline(res.body, createWriteStream(dest));
}

async function main() {
  console.log("Fetching products…");
  const data = await fetchJson(`${STORE}/products.json?limit=250`);
  const products = data.products ?? [];
  console.log(`Found ${products.length} products`);

  await mkdir(OUT_DIR, { recursive: true });

  const manifest = [];
  let downloaded = 0;
  let failed = 0;

  for (const product of products) {
    const handle = product.handle;
    const dir = path.join(OUT_DIR, handle);
    await mkdir(dir, { recursive: true });

    const images = product.images ?? [];
    const entries = [];

    for (let i = 0; i < images.length; i++) {
      const src = images[i].src;
      if (!src) continue;

      const ext = extFromUrl(src);
      const filename = `${String(i + 1).padStart(2, "0")}.${ext}`;
      const dest = path.join(dir, filename);

      try {
        // Request original size (Shopify CDN)
        const url = src.includes("?") ? src : `${src}?width=2400`;
        process.stdout.write(`  ${handle}/${filename} … `);
        await downloadFile(url, dest);
        downloaded++;
        console.log("ok");
        entries.push({ file: filename, src, position: images[i].position ?? i });
      } catch (err) {
        failed++;
        console.log(`fail (${err.message})`);
        entries.push({ file: null, src, error: err.message });
      }
    }

    manifest.push({
      id: product.id,
      title: product.title,
      handle,
      vendor: product.vendor,
      product_type: product.product_type,
      tags: product.tags,
      imageCount: images.length,
      images: entries,
    });
  }

  await writeFile(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify({ store: STORE, exportedAt: new Date().toISOString(), products: manifest }, null, 2),
    "utf8",
  );

  console.log("\nDone.");
  console.log(`  Products: ${products.length}`);
  console.log(`  Downloaded: ${downloaded}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Output: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
