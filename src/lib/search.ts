import type { Product } from "@/lib/catalog-types";
import type { Collection } from "@/lib/catalog-types";

export type SearchFilters = {
  category?: Product["category"] | "all";
  sale?: boolean;
};

export function productMatchesQuery(product: Product, q: string, collections: Collection[] = []) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;

  const collectionNames = (product.collectionSlugs ?? [product.collectionSlug])
    .map((slug) => collections.find((c) => c.slug === slug)?.name || slug)
    .join(" ");

  const haystack = [
    product.name,
    product.story,
    product.collection,
    product.subcategory,
    product.category,
    product.productType,
    collectionNames,
    ...product.details,
    ...product.tags,
  ]
    .join(" ")
    .toLowerCase();

  const tokens = needle.split(/\s+/).filter(Boolean);
  return tokens.every((token) => haystack.includes(token));
}

export function filterProductsForSearch(
  products: Product[],
  q: string,
  filters: SearchFilters,
  collections: Collection[] = [],
) {
  let list = products.filter((p) => p.status === "published");
  if (q.trim()) {
    list = list.filter((p) => productMatchesQuery(p, q, collections));
  }
  if (filters.category && filters.category !== "all") {
    list = list.filter((p) => p.category === filters.category);
  }
  if (filters.sale) {
    list = list.filter((p) => p.onSale);
  }
  return list;
}

export function collectionSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function productInCollection(
  product: { collectionSlug: string; collectionSlugs?: string[] },
  slug: string,
) {
  if (product.collectionSlug === slug) return true;
  return product.collectionSlugs?.includes(slug) ?? false;
}

export function rankSearchResults(products: Product[], q: string) {
  const needle = q.trim().toLowerCase();
  if (!needle) return products;
  return [...products].sort((a, b) => score(b, needle) - score(a, needle));
}

function score(product: Product, needle: string) {
  const name = product.name.toLowerCase();
  if (name === needle) return 100;
  if (name.startsWith(needle)) return 80;
  if (name.includes(needle)) return 60;
  if (product.story.toLowerCase().includes(needle)) return 40;
  return 10;
}
