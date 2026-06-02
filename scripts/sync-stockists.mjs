/**
 * Sync stockists from Shopify page JSON → src/data/stockists.json
 * Usage: npm run stockists:sync
 */
import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

function titleCase(s) {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bNimes\b/i, "Nîmes");
}

function parseStoreSegment(segment) {
  const line = segment.trim();
  if (!line || /^you are retailer/i.test(line)) return null;
  const handle = line.match(/@([a-z0-9_.]+)/i);
  const name = line
    .replace(/\|.*@.*/, "")
    .replace(/@.*/, "")
    .replace(/\|/g, "")
    .trim();
  if (!name || name.length < 2) return null;
  return {
    name: titleCase(name),
    instagram: handle ? `@${handle[1]}` : undefined,
    url: handle ? `https://www.instagram.com/${handle[1]}/` : undefined,
  };
}

function parseStoreLine(line) {
  const parts = line.split("|").map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) {
    const store = parseStoreSegment(line);
    return store ? [store] : [];
  }
  const handlePart = parts.find((p) => p.includes("@"));
  const handle = handlePart?.match(/@([a-z0-9_.]+)/i);
  const stores = [];
  for (const part of parts) {
    if (part.includes("@")) continue;
    stores.push({
      name: titleCase(part),
      instagram: handle ? `@${handle[1]}` : undefined,
      url: handle ? `https://www.instagram.com/${handle[1]}/` : undefined,
    });
  }
  return stores;
}

function isCountryName(text) {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t || t.length > 35 || t.includes("@")) return false;
  if (/retailer|email|catch us/i.test(t)) return false;
  return /^[A-ZÀ-Ÿ][A-ZÀ-Ÿ\s]{0,30}$/.test(t);
}

function parseBodyHtml(html) {
  html = html.replace(/<img[^>]*>/gi, "");
  const countries = [];
  const paragraphs = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];

  let current = null;
  let currentArea = null;

  for (const p of paragraphs) {
    const inner = p;
    const plain = stripHtml(inner);
    if (!plain || plain === "charset=utf-8") continue;

    const strongBlocks = [...inner.matchAll(/<strong>([\s\S]*?)<\/strong>/gi)];
    for (const [, raw] of strongBlocks) {
      const name = stripHtml(raw).replace(/\s+/g, " ").trim();
      if (isCountryName(name)) {
        current = { country: titleCase(name), areas: [] };
        countries.push(current);
        currentArea = null;
      }
    }

    if (!current) continue;

    const areaMatches = [
      ...inner.matchAll(/text-decoration:\s*underline[^>]*>[\s\S]*?<em>([^<]+)<\/em>/gi),
      ...inner.matchAll(/text-decoration:\s*underline[^>]*>([^<]+)<\/span>/gi),
    ];
    for (const [, raw] of areaMatches) {
      const areaName = stripHtml(raw).trim();
      if (areaName && areaName.length < 50) {
        currentArea = { name: titleCase(areaName), stores: [] };
        current.areas.push(currentArea);
      }
    }

    const lines = plain.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (isCountryName(line)) continue;
      if (/^you are retailer/i.test(line)) continue;
      if (/^please email/i.test(line)) continue;
      if (line.includes("info@")) continue;

      const isAreaLine = areaMatches.some(([, a]) => stripHtml(a).toLowerCase() === line.toLowerCase());
      if (isAreaLine) continue;

      const stores = parseStoreLine(line);
      for (const store of stores) {
        if (!store) continue;
        if (!currentArea) {
          currentArea = { name: "General", stores: [] };
          current.areas.push(currentArea);
        }
        const exists = currentArea.stores.some((s) => s.name.toLowerCase() === store.name.toLowerCase());
        if (!exists) currentArea.stores.push(store);
      }
    }
  }

  return countries;
}

const res = await fetch("https://bingindiaries.com/pages/find-us.json");
const { page } = await res.json();
const countries = parseBodyHtml(page.body_html || "");

const data = {
  source: "https://bingindiaries.com/pages/find-us",
  syncedAt: new Date().toISOString(),
  heroImage: "/lifestyle/journal-bingin.jpg",
  wholesaleEmail: "info@bingindiaries.com",
  countries,
};

const outPath = join(root, "src/data/stockists.json");
const ok =
  countries.length >= 5 &&
  countries.every((c) => c.areas.some((a) => a.stores.length > 0));

if (!ok) {
  console.warn("Parser output incomplete — keeping existing stockists.json");
  console.warn("Parsed:", countries.map((c) => `${c.country} (${c.areas.reduce((n, a) => n + a.stores.length, 0)} stores)`).join(", "));
  process.exit(1);
}

await writeFile(outPath, JSON.stringify(data, null, 2));
console.log(`Synced ${countries.length} countries`);
for (const c of countries) {
  const stores = c.areas.reduce((n, a) => n + a.stores.length, 0);
  console.log(`  ${c.country}: ${c.areas.length} areas, ${stores} stores`);
}
