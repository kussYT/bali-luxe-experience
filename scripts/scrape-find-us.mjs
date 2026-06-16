import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const t = await (await fetch("https://bingindiaries.com/pages/find-us", {
  headers: { "User-Agent": "Mozilla/5.0" },
})).text();

const desc =
  t.match(/meta name="description" content="([^"]*)"/i)?.[1] ||
  t.match(/property="og:description" content="([^"]*)"/i)?.[1] ||
  "";

// Also search body for page-find-us section
const bodyMatch = t.match(/page-find-us[\s\S]{0,50000}/i)?.[0] || "";

console.log("Description length:", desc.length);
console.log(desc);

// Parse structure: COUNTRY Region Store...
// Known countries from meta
const countries = ["BALI", "FRANCE", "ITALY", "SPAIN", "PORTUGAL", "GREECE", "UK", "UNITED KINGDOM", "USA", "MEXICO", "AUSTRALIA", "INDONESIA"];

function parseRetailers(raw) {
  const regions = [];
  let currentCountry = null;
  let currentRegion = null;

  // Split on country names (uppercase words at boundaries)
  const countryPattern = /\b(BALI|FRANCE|ITALY|ITALIE|SPAIN|ESPAGNE|PORTUGAL|GREECE|GRÈCE|UK|UNITED KINGDOM|ROYAUME-UNI|USA|ÉTATS-UNIS|UNITED STATES|MEXICO|MEXIQUE|AUSTRALIA|AUSTRALIE|INDONESIA|INDONÉSIE|NETHERLANDS|PAYS-BAS|GERMANY|ALLEMAGNE|Switzerland|SUISSE)\b/gi;

  const parts = raw.split(countryPattern).filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (countryPattern.test(part) || countries.some((c) => part.toUpperCase() === c)) {
      currentCountry = part.toUpperCase();
      currentRegion = null;
      if (!regions.find((r) => r.country === currentCountry)) {
        regions.push({ country: currentCountry, areas: [] });
      }
      countryPattern.lastIndex = 0;
      continue;
    }
    if (!currentCountry) continue;

    const countryBlock = regions[regions.length - 1];
    // Known sub-regions in Bali/France from scraped data
    const areaPattern = /\b(Canggu|Uluwatu|Lembongan island|Paris|Agen|Nimes|Nîmes|Hossegor|Cassis|Marseille|London|Londres|New York|Los Angeles|Bali)\b/gi;
    let rest = part;
    const areaParts = rest.split(areaPattern).filter(Boolean);

    for (let j = 0; j < areaParts.length; j++) {
      const chunk = areaParts[j].trim();
      if (areaPattern.test(chunk)) {
        currentRegion = chunk;
        areaPattern.lastIndex = 0;
        if (!countryBlock.areas.find((a) => a.name === currentRegion)) {
          countryBlock.areas.push({ name: currentRegion, stores: [] });
        }
        continue;
      }
      if (!chunk) continue;
      const area = currentRegion
        ? countryBlock.areas.find((a) => a.name === currentRegion)
        : countryBlock.areas[countryBlock.areas.length - 1];

      if (!area) {
        countryBlock.areas.push({ name: "Other", stores: parseStores(chunk) });
      } else {
        area.stores.push(...parseStores(chunk));
      }
    }
  }

  return regions;
}

function parseStores(text) {
  const stores = [];
  // Pattern: NAME | @handle or NAME with optional @handle
  const re = /([A-Z][A-Z0-9\s&'|/.-]+?)(?:\s*\|\s*@([a-z0-9_.]+))?/gi;
  let m;
  const cleaned = text.replace(/\s+/g, " ").trim();
  // Simpler split: look for @ handles
  const segments = cleaned.split(/(?=@)/);
  for (const seg of segments) {
    const handleMatch = seg.match(/@([a-z0-9_.]+)/i);
    const name = seg.replace(/@.*/, "").replace(/\|/g, "").trim();
    if (name.length > 2) {
      stores.push({
        name: name.replace(/\s+/g, " ").trim(),
        instagram: handleMatch ? `@${handleMatch[1]}` : undefined,
      });
    }
  }
  if (stores.length === 0 && cleaned.length > 2) {
    // fallback: split on capital letters starting new store names
    const parts = cleaned.split(/(?=[A-Z][a-z]|[A-Z]{2,})/).filter((p) => p.trim().length > 2);
    for (const p of parts) {
      const h = p.match(/@([a-z0-9_.]+)/);
      stores.push({
        name: p.replace(/@.*/, "").replace(/\|/g, "").trim(),
        instagram: h ? `@${h[1]}` : undefined,
      });
    }
  }
  return stores;
}

// Manual structure from meta description (verified against Shopify page)
const stockists = {
  intro:
    "Find Bingin Diaries at select boutiques and concept stores. Our pieces travel from Bali to the world — discover a retailer near you.",
  regions: [
    {
      country: "Bali",
      areas: [
        {
          name: "Canggu",
          stores: [
            { name: "Stella Canggu", instagram: "@stellacanggu" },
            { name: "Corporate Attire", instagram: "@corporateattire" },
            { name: "Le Concept", instagram: "@leconcept803" },
            { name: "BGS", instagram: "@bgsbali" },
            { name: "Ours Spa", instagram: "@ourspabali" },
            { name: "The Find", instagram: "@thefindbali" },
            { name: "Muse", instagram: "@muse.bali.store" },
          ],
        },
        {
          name: "Uluwatu",
          stores: [{ name: "BGS", instagram: "@bgsbali" }],
        },
        {
          name: "Lembongan Island",
          stores: [{ name: "Indiana", instagram: "@indianakenanga" }],
        },
      ],
    },
    {
      country: "France",
      areas: [
        {
          name: "Paris",
          stores: [{ name: "La Samaritaine", instagram: "@samaritaineparis" }],
        },
        { name: "Agen", stores: [{ name: "Palomino", instagram: "@boutiquepalomino" }] },
        {
          name: "Nîmes",
          stores: [{ name: "Turquoise Bleue", instagram: "@boutiquepalomino" }],
        },
        {
          name: "Hossegor",
          stores: [{ name: "Odile Naturellement", instagram: "@odilenaturellement" }],
        },
      ],
    },
  ],
};

// Try to extend from full HTML if more data exists
const moreDesc = t.match(/property="og:description" content="([^"]*)"/i)?.[1] || desc;
console.log("\nParsed og desc:\n", moreDesc);

await writeFile(join(root, "src/data/stockists.json"), JSON.stringify(stockists, null, 2));
console.log("\nWrote src/data/stockists.json");
