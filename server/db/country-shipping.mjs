import { getSetting, setSetting } from "./settings-store.mjs";
import DEFAULT_FULFILLMENT from "../../data/fulfillment-zones.default.json" with { type: "json" };
import CATALOG from "../../data/country-shipping-catalog.json" with { type: "json" };

const DEFAULT_SHIPPING_ZONES = [
  {
    id: "europe",
    name: "Europe",
    countries: ["FR", "DE", "AT", "BE", "ES", "IT", "NL", "PT", "IE", "GB", "CH", "LU", "MC"],
    rates: { EUR: 8, USD: 12, IDR: 120_000 },
  },
  {
    id: "world",
    name: "Rest of world",
    countries: ["*"],
    rates: { EUR: 15, USD: 18, IDR: 200_000 },
  },
];
/** @typedef {'france' | 'bali'} WarehouseId */

const BALI_DEFAULT = new Set(CATALOG.baliWarehouseDefaults || []);
const EUROPE_CODES = new Set(
  CATALOG.continents.find((c) => c.id === "europe")?.countries.map((c) => c.code) || [],
);

function defaultWarehouse(code) {
  if (BALI_DEFAULT.has(code)) return "bali";
  if (EUROPE_CODES.has(code)) return "france";
  return "bali";
}

function defaultPrice(currency) {
  if (currency === "EUR") return 8;
  if (currency === "IDR") return 200_000;
  return 18;
}

function allCatalogCountries() {
  return CATALOG.continents.flatMap((continent) =>
    continent.countries.map((c) => ({
      ...c,
      continent: continent.id,
    })),
  );
}

function zonePriceForCountry(code, currency, zones) {
  const upper = code.toUpperCase();
  let zone = zones.find((z) => z.countries.includes(upper));
  if (!zone) zone = zones.find((z) => z.countries.includes("*"));
  const rates = zone?.rates || {};
  return rates[currency] ?? defaultPrice(currency);
}

function normalizeLegacyFulfillment(raw) {
  const france = Array.isArray(raw?.franceWarehouseCountries)
    ? raw.franceWarehouseCountries.map((c) => String(c).trim().toUpperCase()).filter(Boolean)
    : DEFAULT_FULFILLMENT.franceWarehouseCountries;
  const bali = Array.isArray(raw?.baliWarehouseCountries)
    ? raw.baliWarehouseCountries.map((c) => String(c).trim().toUpperCase()).filter(Boolean)
    : DEFAULT_FULFILLMENT.baliWarehouseCountries;
  return { franceWarehouseCountries: france, baliWarehouseCountries: bali };
}

async function buildFromLegacy() {
  const fulfillment = normalizeLegacyFulfillment(await getSetting("fulfillmentZones", null));
  const shippingRaw = await getSetting("shipping", null);
  const shipping = shippingRaw?.zones?.length ? { zones: shippingRaw.zones } : { zones: DEFAULT_SHIPPING_ZONES };
  const franceSet = new Set(fulfillment.franceWarehouseCountries);
  const baliSet = new Set(fulfillment.baliWarehouseCountries);
  const countries = {};

  for (const c of allCatalogCountries()) {
    let warehouse = defaultWarehouse(c.code);
    if (franceSet.has(c.code)) warehouse = "france";
    else if (baliSet.has(c.code)) warehouse = "bali";
    else if (!franceSet.size && !baliSet.size) warehouse = defaultWarehouse(c.code);

    countries[c.code] = {
      enabled: true,
      warehouse,
      shippingPrice: zonePriceForCountry(c.code, c.currency, shipping.zones),
    };
  }

  return { countries };
}

export async function getCountryShippingConfig() {
  const stored = await getSetting("countryShipping", null);
  if (stored?.countries && Object.keys(stored.countries).length > 0) {
    return normalizeCountryShipping(stored);
  }
  return buildFromLegacy();
}

export function normalizeCountryShipping(raw) {
  const countries = {};
  for (const c of allCatalogCountries()) {
    const saved = raw?.countries?.[c.code];
    countries[c.code] = {
      enabled: saved?.enabled !== false,
      warehouse:
        saved?.warehouse === "france" || saved?.warehouse === "bali"
          ? saved.warehouse
          : defaultWarehouse(c.code),
      shippingPrice:
        Number(saved?.shippingPrice) >= 0 && saved?.shippingPrice != null
          ? Number(saved.shippingPrice)
          : defaultPrice(c.currency),
    };
  }
  return { countries };
}

export async function saveCountryShippingConfig(config) {
  const next = normalizeCountryShipping(config);
  await setSetting("countryShipping", next);
  await setSetting("fulfillmentZones", fulfillmentZonesFromConfig(next));
  return next;
}

export async function getCountryShippingRows() {
  const config = await getCountryShippingConfig();
  return allCatalogCountries().map((c) => ({
    code: c.code,
    name: c.name,
    currency: c.currency,
    continent: c.continent,
    enabled: config.countries[c.code]?.enabled ?? true,
    warehouse: config.countries[c.code]?.warehouse ?? defaultWarehouse(c.code),
    shippingPrice: config.countries[c.code]?.shippingPrice ?? defaultPrice(c.currency),
  }));
}

export async function isCountryShippingEnabled(code) {
  const config = await getCountryShippingConfig();
  const rule = config.countries[(code || "FR").toUpperCase()];
  return rule?.enabled !== false;
}

export async function shippingPriceForCountry(code, currency) {
  const upper = (code || "FR").toUpperCase();
  const config = await getCountryShippingConfig();
  const rule = config.countries[upper];
  if (rule?.enabled === false) return null;
  if (rule && Number.isFinite(rule.shippingPrice)) return rule.shippingPrice;
  return defaultPrice(currency);
}

export async function warehouseForCountry(code) {
  const upper = (code || "FR").toUpperCase();
  const config = await getCountryShippingConfig();
  const rule = config.countries[upper];
  if (rule?.warehouse === "france" || rule?.warehouse === "bali") return rule.warehouse;
  return defaultWarehouse(upper);
}

export function fulfillmentZonesFromConfig(config) {
  const franceWarehouseCountries = [];
  const baliWarehouseCountries = [];
  for (const [code, rule] of Object.entries(config.countries)) {
    if (rule.enabled === false) continue;
    if (rule.warehouse === "france") franceWarehouseCountries.push(code);
    else baliWarehouseCountries.push(code);
  }
  return {
    franceWarehouseCountries,
    baliWarehouseCountries,
    restOfWorldWarehouse: "bali",
  };
}

export async function getFulfillmentZonesFromCountryShipping() {
  const config = await getCountryShippingConfig();
  return fulfillmentZonesFromConfig(config);
}

export function getCountryShippingCatalog() {
  return CATALOG;
}
