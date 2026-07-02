import type { Product } from "@/lib/catalog-types";

export function sortProductsForDisplay(products: Product[]) {
  return [...products].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
  );
}
