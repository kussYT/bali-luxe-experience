import type { Product, Collection, ProductCategory } from "@/lib/catalog-types";

export type { Product, Collection, ProductCategory };

/** @deprecated Import useCatalog() for live catalog data. */
export { useCatalog } from "@/lib/catalog-context";

export function getProductFromList(products: Product[], slug: string) {
  return products.find((p) => p.slug === slug);
}
