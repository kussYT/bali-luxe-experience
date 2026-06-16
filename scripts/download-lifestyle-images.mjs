/**
 * Télécharge des visuels lifestyle (Pexels — licence libre).
 * Usage: node scripts/download-lifestyle-images.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "lifestyle");

function pexels(id, w = 1400) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
}

/** [filename, url] */
const IMAGES = [
  ["hero.jpg", pexels(1450353, 1920)], // Bali temple coast
  ["editorial-designed.jpg", pexels(2472087, 1400)], // rice terraces
  ["journal-bingin.jpg", pexels(1032650, 1200)], // surf beach
  ["journal-sunset.jpg", pexels(2387873, 1200)], // tropical sunset beach
  ["journal-packing.jpg", pexels(10589586, 1200)], // travel flat lay
  ["journal-uluwatu.jpg", pexels(1320684, 1200)], // tropical villa morning
  ["lookbook-sunburn.jpg", pexels(3225528, 1600)], // woman beach summer
  ["lookbook-salt.jpg", pexels(3601451, 1600)], // coastal lifestyle
  ["lookbook-riviera.jpg", pexels(1536619, 1600)], // fashion summer
  ["shop-mood.jpg", pexels(1462637, 1920)], // editorial portrait woman
  ["craft-fabric.jpg", pexels(6043714, 900)], // natural textile close-up
  ["craft-hands.jpg", pexels(4066293, 900)], // artisan hands
  ["craft-travel.jpg", pexels(346885, 900)], // travel bag
  ["craft-packaging.jpg", pexels(4489702, 900)], // natural kraft paper
];

async function download(name, url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "BinginDiaries-Dev/1.0" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 5000) throw new Error(`File too small (${buf.length} bytes)`);
  await writeFile(join(outDir, name), buf);
  console.log(`  ✓ ${name} (${(buf.length / 1024).toFixed(0)} KB)`);
}

await mkdir(outDir, { recursive: true });
console.log(`Downloading ${IMAGES.length} images → public/lifestyle/\n`);

let ok = 0;
for (const [name, url] of IMAGES) {
  try {
    await download(name, url);
    ok++;
  } catch (e) {
    console.error(`  ✗ ${name}:`, e.message);
  }
}

console.log(`\nDone. ${ok}/${IMAGES.length} saved.`);
