import { getSetting, setSetting } from "./settings-store.mjs";
import DEFAULT_RAW from "../../data/fulfillment-zones.default.json" with { type: "json" };

export function normalizeFulfillmentZones(raw) {
  const france = Array.isArray(raw?.franceWarehouseCountries)
    ? raw.franceWarehouseCountries.map((c) => String(c).trim().toUpperCase()).filter(Boolean)
    : DEFAULT_RAW.franceWarehouseCountries;
  const bali = Array.isArray(raw?.baliWarehouseCountries)
    ? raw.baliWarehouseCountries.map((c) => String(c).trim().toUpperCase()).filter(Boolean)
    : DEFAULT_RAW.baliWarehouseCountries;
  const rest = raw?.restOfWorldWarehouse === "france" ? "france" : "bali";
  return {
    franceWarehouseCountries: france,
    baliWarehouseCountries: bali,
    restOfWorldWarehouse: rest,
  };
}

export async function getFulfillmentZones() {
  const countryShipping = await getSetting("countryShipping", null);
  if (countryShipping?.countries && Object.keys(countryShipping.countries).length > 0) {
    const { fulfillmentZonesFromConfig } = await import("./country-shipping.mjs");
    return fulfillmentZonesFromConfig(countryShipping);
  }
  const stored = await getSetting("fulfillmentZones", null);
  return normalizeFulfillmentZones(stored);
}

export async function saveFulfillmentZones(patch) {
  const current = await getFulfillmentZones();
  const next = normalizeFulfillmentZones({ ...current, ...patch });
  await setSetting("fulfillmentZones", next);
  return next;
}
