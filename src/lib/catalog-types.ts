export type ProductCategory = "hats" | "accessories" | "bags";
export type ProductStatus = "published" | "draft";
export type ProductOrigin = "Bali" | "France";

export type Collection = {
  slug: string;
  name: string;
  season: string;
};

export type Product = {
  slug: string;
  name: string;
  story: string;
  collection: string;
  collectionSlug: string;
  subcategory: string;
  category: ProductCategory;
  productType: string;
  priceEUR: number;
  compareAtEUR?: number;
  priceUSD: number;
  priceIDR: number;
  image: string;
  images: string[];
  details: string[];
  tags: string[];
  stock: number;
  status: ProductStatus;
  featured: boolean;
  onSale?: boolean;
  available: boolean;
  origin: ProductOrigin;
};

export type Catalog = {
  generatedAt: string;
  store: string;
  productCount: number;
  collections: Collection[];
  products: Product[];
};
