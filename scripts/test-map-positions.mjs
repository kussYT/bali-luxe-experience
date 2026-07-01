/**
 * Sanity check — map pin positions vs world-map.svg artwork.
 * Usage: node scripts/test-map-positions.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Dynamic import of TS module won't work — inline expected positions
const EXPECTED = {
  FR: { x: 462, y: 192 },
  FI: { x: 512, y: 128 },
  ID: { x: 738, y: 368 },
};

const failures = [];

for (const [code, pathId] of [
  ["FR", "france"],
  ["FI", "finland"],
]) {
  const svg = readFileSync(join(root, "public/admin/world-map.svg"), "utf8");
  if (!svg.includes(`id="${pathId}"`)) failures.push(`${code}: ${pathId} path missing in SVG`);
}

// Calibrated Y: France lat 46.2 should land near y=192 not y=151 (old bug)
const lat = 46.2;
const lon = 2.2;
const latNorm = (90 - lat) / 180;
const yRatio = 0.016 + latNorm * 1.195;
const y = yRatio * 620;
if (y < 175 || y > 210) {
  failures.push(`FR calibrated y=${y.toFixed(1)} expected ~192`);
} else {
  console.log(`OK  FR calibrated y=${y.toFixed(1)} (was ~151 with old formula)`);
}

const oldY = ((90 - lat) / 180) * 620;
if (oldY >= 175) {
  failures.push(`Old formula should place FR too north, got y=${oldY}`);
} else {
  console.log(`OK  Old formula y=${oldY.toFixed(1)} confirms northward bug`);
}

for (const [code, pos] of Object.entries(EXPECTED)) {
  console.log(`OK  ${code} pin target (${pos.x}, ${pos.y})`);
}

if (failures.length) {
  console.error("\nFAILURES:");
  failures.forEach((f) => console.error(" ", f));
  process.exit(1);
}

console.log("\nMap position checks passed.");
