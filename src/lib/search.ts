import type { Product } from "./products";

export function productMatchesQuery(product: Product, q: string) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    product.name,
    product.story,
    product.collection,
    product.category,
    ...product.details,
    ...product.tags,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function collectionSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}
