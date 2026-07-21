import type { Product, ProductCategory } from "@/lib/catalog-types";
import { productInCollection } from "@/lib/search";

/** Primary collections — Beatrice nav & product form */
export const PRODUCT_COLLECTIONS = [
  { slug: "mi-paradisio-collection", name: "Mi Paradisio" },
  { slug: "special-occasions", name: "Wedding Guest" },
  { slug: "galore-capsule-collection", name: "Galore Capsule Collection" },
  { slug: "sunburn", name: "Sunburn" },
  { slug: "feel-the-yarn", name: "Feel The Yarn" },
  { slug: "new-collection-2023", name: "Heatwave" },
  { slug: "juicy-record", name: "Juicy Records" },
  { slug: "wild-kids", name: "Wild Kids" },
  { slug: "retro-safari", name: "Retro Safari" },
  { slug: "90s-fisher", name: "90's Era" },
] as const;

export type ProductCollectionSlug = (typeof PRODUCT_COLLECTIONS)[number]["slug"];

export type ShopCategoryDef = {
  slug: string;
  label: string;
  productCategory: ProductCategory;
  /** Stored in product.subcategory */
  subcategoryValue: string;
  matches: (product: Product) => boolean;
};

function subcategoryIs(product: Product, slug: string) {
  return product.subcategory?.trim().toLowerCase() === slug.toLowerCase();
}

export const SHOP_CATEGORIES: ShopCategoryDef[] = [
  {
    slug: "best-seller",
    label: "Best Seller",
    productCategory: "hats",
    subcategoryValue: "best-seller",
    matches: (p) => p.featured || productInCollection(p, "best-sellers"),
  },
  {
    slug: "all-accessories",
    label: "All accessories",
    productCategory: "accessories",
    subcategoryValue: "all-accessories",
    matches: (p) => p.category === "accessories" || subcategoryIs(p, "all-accessories"),
  },
  {
    slug: "cotton-hat",
    label: "Cotton Hat",
    productCategory: "hats",
    subcategoryValue: "cotton-hat",
    matches: (p) => subcategoryIs(p, "cotton-hat"),
  },
  {
    slug: "felted-wool-hat",
    label: "Felted Wool Hat",
    productCategory: "hats",
    subcategoryValue: "felted-wool-hat",
    matches: (p) => subcategoryIs(p, "felted-wool-hat"),
  },
  {
    slug: "crochet-hat",
    label: "Crochet Hat",
    productCategory: "hats",
    subcategoryValue: "crochet-hat",
    matches: (p) => subcategoryIs(p, "crochet-hat"),
  },
  {
    slug: "cap",
    label: "Cap",
    productCategory: "hats",
    subcategoryValue: "cap",
    matches: (p) => subcategoryIs(p, "cap"),
  },
  {
    slug: "knits-winter-hat",
    label: "Knit & Winter Hat",
    productCategory: "hats",
    subcategoryValue: "knits-winter-hat",
    matches: (p) =>
      subcategoryIs(p, "knits-winter-hat") || productInCollection(p, "the-knits"),
  },
  {
    slug: "kids",
    label: "Kids",
    productCategory: "hats",
    subcategoryValue: "kids",
    matches: (p) => subcategoryIs(p, "kids") || productInCollection(p, "wild-kids"),
  },
];

export function getCollectionBySlug(slug: string) {
  return PRODUCT_COLLECTIONS.find((c) => c.slug === slug);
}

export function getShopCategoryBySlug(slug: string) {
  return SHOP_CATEGORIES.find((c) => c.slug === slug);
}

export function getShopCategoryLabel(subcategory: string | undefined) {
  if (!subcategory?.trim()) return "";
  return SHOP_CATEGORIES.find((c) => c.subcategoryValue === subcategory)?.label ?? subcategory;
}

export function productMatchesShopCategory(product: Product, shopSlug: string) {
  const def = getShopCategoryBySlug(shopSlug);
  return def ? def.matches(product) : subcategoryIs(product, shopSlug);
}

export function shopCategoryFromSubcategory(subcategory: string | undefined) {
  if (!subcategory?.trim()) return "";
  return SHOP_CATEGORIES.find((c) => c.subcategoryValue === subcategory)?.slug ?? "";
}

export function applyShopCategoryToProduct(
  shopSlug: string,
): { subcategory: string; category: ProductCategory; featured?: boolean } {
  const def = getShopCategoryBySlug(shopSlug);
  if (!def) {
    return { subcategory: shopSlug, category: "hats" };
  }
  return {
    subcategory: def.subcategoryValue,
    category: def.productCategory,
    featured: def.slug === "best-seller" ? true : undefined,
  };
}
