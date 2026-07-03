import type { Product, ProductVariant, WarehouseId } from "@/lib/catalog-types";
import type { FulfillmentZones } from "@/lib/fulfillment-zones-types";
import { DEFAULT_FULFILLMENT_ZONES } from "@/lib/fulfillment-zones-default";

export type { FulfillmentZones };

export function fulfillmentWarehouseForCountry(
  countryCode: string | null | undefined,
  zones: FulfillmentZones = DEFAULT_FULFILLMENT_ZONES,
  product?: Product,
): WarehouseId {
  const code = (countryCode || "FR").toUpperCase();
  if (zones.franceWarehouseCountries.includes(code)) return "france";
  if (zones.baliWarehouseCountries.includes(code)) return "bali";
  return product?.defaultWarehouse === "france" ? "france" : zones.restOfWorldWarehouse;
}

/** @deprecated use fulfillmentWarehouseForCountry */
export function preferredWarehouse(
  countryCode: string | null | undefined,
  product?: Product,
  zones: FulfillmentZones = DEFAULT_FULFILLMENT_ZONES,
): WarehouseId {
  return fulfillmentWarehouseForCountry(countryCode, zones, product);
}

export function fulfillmentWarehouseLabel(id: WarehouseId): string {
  return id === "france" ? "Paris" : "Bali";
}

export function getDefaultVariant(product: Product): ProductVariant | null {
  const variants = product.variants;
  if (!variants?.length) return null;
  return variants.find((v) => v.isDefault) ?? variants[0];
}

export function getVariant(product: Product, variantId?: string | null): ProductVariant | null {
  const variants = product.variants;
  if (!variants?.length) return null;
  if (variantId) {
    const found = variants.find((v) => v.id === variantId);
    if (found) return found;
  }
  return getDefaultVariant(product);
}

function stockAtWarehouse(
  product: Product,
  variant: ProductVariant | null,
  warehouse: WarehouseId,
): number {
  if (variant?.inventory) return variant.inventory[warehouse] ?? 0;
  if (warehouse === "france") return product.stockFrance ?? 0;
  return product.stockBali ?? 0;
}

/** Stock available for the customer's region only — no cross-warehouse fallback. */
export function maxCartQty(
  product: Product,
  countryCode: string | null | undefined,
  variantId?: string | null,
  zones: FulfillmentZones = DEFAULT_FULFILLMENT_ZONES,
): number {
  const warehouse = fulfillmentWarehouseForCountry(countryCode, zones, product);
  const variant = getVariant(product, variantId);
  return stockAtWarehouse(product, variant, warehouse);
}

export function productHasRegionalStock(
  product: Product,
  countryCode: string | null | undefined,
  zones: FulfillmentZones = DEFAULT_FULFILLMENT_ZONES,
): boolean {
  const warehouse = fulfillmentWarehouseForCountry(countryCode, zones, product);
  const variants = product.variants?.length ? product.variants : [null];
  return variants.some((variant) => stockAtWarehouse(product, variant, warehouse) > 0);
}

export function filterProductsForRegion(
  products: Product[],
  countryCode: string | null | undefined,
  zones: FulfillmentZones = DEFAULT_FULFILLMENT_ZONES,
): Product[] {
  return products.filter((p) => productHasRegionalStock(p, countryCode, zones));
}

export function availableForCheckout(
  product: Product,
  countryCode: string | null | undefined,
  qty: number,
  variantId?: string | null,
  zones: FulfillmentZones = DEFAULT_FULFILLMENT_ZONES,
): { ok: boolean; available: number; warehouse: WarehouseId | null } {
  const warehouse = fulfillmentWarehouseForCountry(countryCode, zones, product);
  const variant = getVariant(product, variantId);
  const available = stockAtWarehouse(product, variant, warehouse);

  if (!variant?.inventory && !product.stockFrance && !product.stockBali && product.stock != null) {
    const stock = product.stock ?? 0;
    return { ok: stock >= qty, available: stock, warehouse: null };
  }

  return {
    ok: available >= qty,
    available,
    warehouse: available > 0 ? warehouse : warehouse,
  };
}
