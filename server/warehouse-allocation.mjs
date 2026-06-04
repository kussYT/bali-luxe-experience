/** @typedef {'france' | 'bali'} WarehouseId */

/** Countries fulfilled primarily from Bali */
const BALI_FIRST = new Set([
  "ID", "AU", "NZ", "SG", "HK", "JP", "KR", "TW", "TH", "VN", "MY", "NC", "PF",
]);

/** France + EU / nearby — fulfilled from Paris */
const FRANCE_FIRST = new Set([
  "FR", "DE", "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "ES", "EE", "FI", "GR", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "MC", "NL", "PL", "PT", "RO", "SK", "SI", "SE", "GB", "CH",
  "NO", "AD", "GF", "GP", "MQ", "YT", "RE", "BL", "MF", "PM", "AX", "JE", "MC",
]);

/**
 * Preferred fulfillment warehouse for a shipping country.
 * @param {string | null | undefined} countryCode ISO 3166-1 alpha-2
 * @param {{ defaultWarehouse?: WarehouseId }} [product]
 * @returns {WarehouseId}
 */
export function preferredWarehouse(countryCode, product) {
  const code = (countryCode || "FR").toUpperCase();
  if (BALI_FIRST.has(code)) return "bali";
  if (FRANCE_FIRST.has(code)) return "france";
  return product?.defaultWarehouse === "france" ? "france" : "bali";
}

/**
 * Default variant for cart/checkout when no variant is selected.
 * @param {{ variants?: { isDefault?: boolean }[] }} product
 */
export function getDefaultVariant(product) {
  const variants = product?.variants;
  if (!variants?.length) return null;
  return variants.find((v) => v.isDefault) ?? variants[0];
}

/**
 * Available units for checkout: primary warehouse first, then fallback.
 * @param {{ stock?: number, defaultWarehouse?: WarehouseId, variants?: { isDefault?: boolean, inventory?: { france: number, bali: number } }[] }} product
 * @param {string | null | undefined} countryCode
 * @param {number} qty
 */
export function availableForCheckout(product, countryCode, qty = 1) {
  const variant = getDefaultVariant(product);
  if (!variant?.inventory) {
    return { ok: (product.stock ?? 0) >= qty, available: product.stock ?? 0, warehouse: null };
  }

  const primary = preferredWarehouse(countryCode, product);
  const secondary = primary === "france" ? "bali" : "france";
  const primaryQty = variant.inventory[primary] ?? 0;
  const secondaryQty = variant.inventory[secondary] ?? 0;

  if (primaryQty >= qty) {
    return { ok: true, available: primaryQty + secondaryQty, warehouse: primary };
  }
  if (primaryQty + secondaryQty >= qty) {
    return { ok: true, available: primaryQty + secondaryQty, warehouse: secondary };
  }
  return { ok: false, available: primaryQty + secondaryQty, warehouse: primary };
}
