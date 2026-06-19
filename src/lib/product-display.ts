import type { Product } from "@/lib/catalog-types";

/** Short line under product name — fashion grid style. */
export function productMiniDescription(product: Product): string {
  if (product.productType?.trim()) return product.productType.trim().toUpperCase();
  if (product.subcategory?.trim()) return product.subcategory.trim().toUpperCase();
  const first = product.story.split(/[.!?]/)[0]?.trim();
  if (first && first.length <= 72) return first.toUpperCase();
  return product.collection.toUpperCase();
}
