export type ProductCategory = "hats" | "accessories" | "bags";
export type ProductStatus = "published" | "draft";
export type ProductOrigin = "Bali" | "France";
export type WarehouseId = "france" | "bali";

export type VariantInventory = {
  france: number;
  bali: number;
};

export type ProductVariant = {
  id: string;
  slug: string;
  sku?: string;
  title: string;
  option1?: string;
  option2?: string;
  option3?: string;
  priceEUR?: number;
  compareAtEUR?: number;
  isDefault?: boolean;
  inventory: VariantInventory;
  available: boolean;
};

export type Collection = {
  slug: string;
  name: string;
  season: string;
  description?: string;
  sortOrder?: number;
};

export type Product = {
  /** Postgres UUID — present when loaded from database */
  id?: string;
  slug: string;
  name: string;
  story: string;
  collection: string;
  collectionSlug: string;
  /** All Shopify collection handles this product belongs to */
  collectionSlugs?: string[];
  subcategory: string;
  category: ProductCategory;
  productType: string;
  priceEUR: number;
  compareAtEUR?: number;
  priceUSD: number;
  priceIDR: number;
  image: string;
  images: string[];
  videoUrl?: string;
  details: string[];
  tags: string[];
  stock: number;
  /** Per-warehouse totals (S2 allocation) */
  stockFrance?: number;
  stockBali?: number;
  status: ProductStatus;
  featured: boolean;
  onSale?: boolean;
  outlet?: boolean;
  available: boolean;
  origin: ProductOrigin;
  defaultWarehouse?: WarehouseId;
  variants?: ProductVariant[];
};

export type Catalog = {
  generatedAt: string;
  store: string;
  productCount: number;
  collections: Collection[];
  products: Product[];
  source?: "postgres" | "json-fallback";
};
