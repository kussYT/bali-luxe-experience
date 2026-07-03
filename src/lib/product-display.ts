import type { Product } from "@/lib/catalog-types";
import { getShopCategoryLabel } from "@/lib/catalog-taxonomy";

/** Short line under product name — fashion grid style. */
export function productMiniDescription(product: Product): string {
  if (product.productType?.trim()) return product.productType.trim().toUpperCase();
  const shopLabel = getShopCategoryLabel(product.subcategory);
  if (shopLabel) return shopLabel.toUpperCase();
  const first = product.story.split(/[.!?]/)[0]?.trim();
  if (first && first.length <= 72) return first.toUpperCase();
  return product.collection.toUpperCase();
}
