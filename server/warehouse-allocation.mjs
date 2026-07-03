/** @typedef {'france' | 'bali'} WarehouseId */

import { getFulfillmentZones, normalizeFulfillmentZones } from "./db/fulfillment-settings.mjs";
import DEFAULT_RAW from "../data/fulfillment-zones.default.json" with { type: "json" };

function defaultZones() {
  return normalizeFulfillmentZones(DEFAULT_RAW);
}

/**
 * Preferred fulfillment warehouse for a shipping country.
 * @param {string | null | undefined} countryCode
 * @param {{ defaultWarehouse?: WarehouseId }} [product]
 * @param {import('./db/fulfillment-settings.mjs').normalizeFulfillmentZones extends (...args: any) => infer R ? R : never} [zones]
 */
export function fulfillmentWarehouseForCountry(countryCode, zones, product) {
  const z = zones || defaultZones();
  const code = (countryCode || "FR").toUpperCase();
  if (z.franceWarehouseCountries.includes(code)) return "france";
  if (z.baliWarehouseCountries.includes(code)) return "bali";
  return product?.defaultWarehouse === "france" ? "france" : z.restOfWorldWarehouse;
}

/** @deprecated use fulfillmentWarehouseForCountry */
export function preferredWarehouse(countryCode, product, zones) {
  return fulfillmentWarehouseForCountry(countryCode, zones, product);
}

export function getDefaultVariant(product) {
  const variants = product?.variants;
  if (!variants?.length) return null;
  return variants.find((v) => v.isDefault) ?? variants[0];
}

export function getVariant(product, variantId) {
  const variants = product?.variants;
  if (!variants?.length) return null;
  if (variantId) {
    const found = variants.find((v) => v.id === variantId);
    if (found) return found;
  }
  return getDefaultVariant(product);
}

function stockAtWarehouse(product, variant, warehouse) {
  if (variant?.inventory) return variant.inventory[warehouse] ?? 0;
  if (warehouse === "france") return product.stockFrance ?? 0;
  return product.stockBali ?? 0;
}

export function availableForCheckoutSync(product, countryCode, qty = 1, variantId = null, zones) {
  const z = zones || defaultZones();
  const warehouse = fulfillmentWarehouseForCountry(countryCode, z, product);
  const variant = getVariant(product, variantId);
  const available = stockAtWarehouse(product, variant, warehouse);

  if (!variant?.inventory && !product.stockFrance && !product.stockBali && product.stock != null) {
    return { ok: (product.stock ?? 0) >= qty, available: product.stock ?? 0, warehouse: null };
  }

  return {
    ok: available >= qty,
    available,
    warehouse,
  };
}

export async function availableForCheckout(product, countryCode, qty = 1, variantId = null, zones) {
  const z = zones || (await getFulfillmentZones());
  return availableForCheckoutSync(product, countryCode, qty, variantId, z);
}

export { getFulfillmentZones };
