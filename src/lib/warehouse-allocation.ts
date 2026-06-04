import type { Product, ProductVariant, WarehouseId } from "@/lib/catalog-types";

const BALI_FIRST = new Set([
  "ID", "AU", "NZ", "SG", "HK", "JP", "KR", "TW", "TH", "VN", "MY", "NC",
]);

const FRANCE_FIRST = new Set([
  "FR", "DE", "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "ES", "EE", "FI", "GR", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "MC", "NL", "PL", "PT", "RO", "SK", "SI", "SE", "GB", "CH",
  "NO", "AD", "GF", "GP", "MQ", "YT", "RE", "BL", "MF", "PM", "AX", "JE",
]);

export function preferredWarehouse(countryCode: string | null | undefined, product?: Product): WarehouseId {
  const code = (countryCode || "FR").toUpperCase();
  if (BALI_FIRST.has(code)) return "bali";
  if (FRANCE_FIRST.has(code)) return "france";
  return product?.defaultWarehouse === "france" ? "france" : "bali";
}

export function getDefaultVariant(product: Product): ProductVariant | null {
  const variants = product.variants;
  if (!variants?.length) return null;
  return variants.find((v) => v.isDefault) ?? variants[0];
}

/** Max qty addable to cart for the customer's shipping country */
export function maxCartQty(product: Product, countryCode: string | null | undefined): number {
  const variant = getDefaultVariant(product);
  if (!variant?.inventory) return product.stock ?? 0;
  return (variant.inventory.france ?? 0) + (variant.inventory.bali ?? 0);
}

export function availableForCheckout(
  product: Product,
  countryCode: string | null | undefined,
  qty: number,
): { ok: boolean; available: number } {
  const variant = getDefaultVariant(product);
  if (!variant?.inventory) {
    const stock = product.stock ?? 0;
    return { ok: stock >= qty, available: stock };
  }
  const primary = preferredWarehouse(countryCode, product);
  const secondary = primary === "france" ? "bali" : "france";
  const primaryQty = variant.inventory[primary] ?? 0;
  const secondaryQty = variant.inventory[secondary] ?? 0;
  const total = primaryQty + secondaryQty;
  return { ok: total >= qty, available: total };
}
