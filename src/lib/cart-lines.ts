import type { Product, ProductVariant } from "@/lib/catalog-types";
import { getDefaultVariant, getVariant } from "@/lib/warehouse-allocation";

export type CartItem = { slug: string; variantId?: string; qty: number };

export type ResolvedCartLine = {
  product: Product;
  variant: ProductVariant | null;
  qty: number;
};

/** Stable key for a cart line (slug + optional variant). */
export function cartLineKey(item: Pick<CartItem, "slug" | "variantId">): string {
  return item.variantId ? `${item.slug}::${item.variantId}` : item.slug;
}

export function resolveCartLine(product: Product, item: CartItem): ResolvedCartLine | null {
  const variant = getVariant(product, item.variantId);
  return { product, variant, qty: item.qty };
}

export function normalizeCartItem(item: CartItem, product?: Product): CartItem {
  const qty = Math.max(1, Math.floor(item.qty) || 1);
  if (!product?.variants?.length) {
    return { slug: item.slug, qty };
  }
  const variant = getVariant(product, item.variantId);
  if (!variant?.id) return { slug: item.slug, qty };
  return { slug: item.slug, variantId: variant.id, qty };
}
