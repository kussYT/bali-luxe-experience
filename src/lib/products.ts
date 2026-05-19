import catalog from "@/data/catalog.json";

export type ProductCategory = "hats" | "accessories" | "bags";

export type Product = {
  slug: string;
  name: string;
  collection: string;
  collectionSlug: string;
  category: ProductCategory;
  productType: string;
  priceEUR: number;
  priceUSD: number;
  priceIDR: number;
  image: string;
  images: string[];
  story: string;
  details: string[];
  tags: string[];
  onSale?: boolean;
  available: boolean;
  origin: "Bali" | "France";
};

export type Collection = {
  slug: string;
  name: string;
  season: string;
};

export const products = catalog.products as Product[];
export const collections = catalog.collections as Collection[];

/** Featured pieces for the homepage (first 8 hats, sale items prioritized). */
export const featuredProducts = [
  ...products.filter((p) => p.onSale),
  ...products.filter((p) => !p.onSale),
]
  .filter((p, i, arr) => arr.findIndex((x) => x.slug === p.slug) === i)
  .slice(0, 8);

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}
