import type { Product } from "@/lib/catalog-types";
import type { Collection } from "@/lib/catalog-types";

export type SearchFilters = {
  category?: Product["category"] | "all";
  sale?: boolean;
};

const SEARCH_SYNONYMS: Record<string, string[]> = {
  beanie: ["beanie", "beanies", "bonnet", "bonnets"],
  sequin: ["sequin", "sequins", "paillette", "paillettes"],
  cap: ["cap", "caps", "casquette", "casquettes"],
  bucket: ["bucket", "bob"],
  ivory: ["ivory", "ivoire", "ecru"],
  white: ["white", "blanc", "blanche"],
  yellow: ["yellow", "jaune"],
  brown: ["brown", "marron"],
  shell: ["shell", "coquillage", "coquillages"],
};

const COMPOUND_TOKENS: Record<string, string[]> = {
  darkbrown: ["dark", "brown"],
  skyblue: ["sky", "blue"],
  lightblue: ["light", "blue"],
  navyblue: ["navy", "blue"],
  midnightblue: ["midnight", "blue"],
};

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[|''']/g, " ")
    .replace(/[_/]/g, " ")
    .replace(/-/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expandToken(token: string) {
  const normalized = normalizeSearchText(token);
  if (!normalized) return [];

  const variants = new Set<string>([normalized]);

  if (normalized.endsWith("s") && normalized.length > 3) {
    variants.add(normalized.slice(0, -1));
  } else if (!normalized.endsWith("s")) {
    variants.add(`${normalized}s`);
  }

  for (const synonyms of Object.values(SEARCH_SYNONYMS)) {
    if (synonyms.includes(normalized)) {
      for (const synonym of synonyms) variants.add(synonym);
    }
  }

  const compound = COMPOUND_TOKENS[normalized.replace(/\s+/g, "")];
  if (compound) {
    for (const part of compound) variants.add(part);
  }

  return [...variants];
}

function tokenMatchesHaystack(token: string, haystack: string) {
  const variants = expandToken(token);
  if (variants.some((variant) => haystack.includes(variant))) return true;

  const compact = token.replace(/\s+/g, "");
  const compound = COMPOUND_TOKENS[compact];
  if (compound?.every((part) => haystack.includes(part))) return true;

  return false;
}

function buildProductHaystack(product: Product, collections: Collection[]) {
  const collectionNames = (product.collectionSlugs ?? [product.collectionSlug])
    .map((slug) => collections.find((c) => c.slug === slug)?.name || slug)
    .join(" ");

  const variantText = (product.variants ?? [])
    .flatMap((v) => [v.title, v.option1, v.option2, v.option3, v.sku])
    .filter(Boolean)
    .join(" ");

  const localeText = product.locales
    ? Object.values(product.locales)
        .flatMap((block) => [block?.name, block?.story])
        .filter(Boolean)
        .join(" ")
    : "";

  return normalizeSearchText(
    [
      product.name,
      product.story,
      product.slug,
      product.collection,
      product.collectionSlug,
      ...(product.collectionSlugs ?? []),
      product.subcategory,
      product.category,
      product.productType,
      collectionNames,
      variantText,
      localeText,
      ...product.details,
      ...product.tags,
    ].join(" "),
  );
}

function countMatchingTokens(tokens: string[], haystack: string) {
  return tokens.filter((token) => tokenMatchesHaystack(token, haystack)).length;
}

export function productMatchesQuery(product: Product, q: string, collections: Collection[] = []) {
  const tokens = normalizeSearchText(q).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const haystack = buildProductHaystack(product, collections);
  return tokens.every((token) => tokenMatchesHaystack(token, haystack));
}

function productMatchesQueryRelaxed(product: Product, q: string, collections: Collection[] = []) {
  const tokens = normalizeSearchText(q).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const haystack = buildProductHaystack(product, collections);
  const matched = countMatchingTokens(tokens, haystack);
  if (matched === tokens.length) return true;
  if (tokens.length === 1) return matched === 1;

  const required = Math.max(1, Math.ceil(tokens.length * 0.6));
  return matched >= required;
}

export function filterProductsForSearch(
  products: Product[],
  q: string,
  filters: SearchFilters,
  collections: Collection[] = [],
) {
  let list = products.filter((p) => p.status === "published");
  if (q.trim()) {
    const strict = list.filter((p) => productMatchesQuery(p, q, collections));
    list =
      strict.length > 0
        ? strict
        : list.filter((p) => productMatchesQueryRelaxed(p, q, collections));
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

export function rankSearchResults(products: Product[], q: string, collections: Collection[] = []) {
  const tokens = normalizeSearchText(q).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return products;
  return [...products].sort((a, b) => score(b, tokens, collections) - score(a, tokens, collections));
}

function score(product: Product, tokens: string[], collections: Collection[]) {
  const haystack = buildProductHaystack(product, collections);
  const phrase = tokens.join(" ");
  const name = normalizeSearchText(product.name);

  if (name === phrase) return 100;
  if (name.startsWith(phrase)) return 80;
  if (name.includes(phrase)) return 60;

  const matched = countMatchingTokens(tokens, haystack);
  if (matched === tokens.length) return 50 + matched * 5;
  if (matched > 0) return 20 + matched * 5;
  return 10;
}
