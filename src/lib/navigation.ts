import type { Collection, Product } from "@/lib/catalog-types";

export const POPULAR_SEARCHES = [
  "bob",
  "bucket",
  "sand",
  "felted wool",
  "kids",
  "surf hat",
] as const;

export type NavLink = {
  label: string;
  to: string;
  search?: Record<string, string>;
  hash?: string;
};

export function buildNavShop(collections: Collection[]): NavLink[] {
  const shopCollections = collections
    .filter((c) => !["archives", "best-sellers", "all-products"].includes(c.slug))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return [
    { label: "View all", to: "/collection" },
    ...shopCollections.map((c) => ({
      label: c.name,
      to: "/collection",
      search: { c: c.slug },
    })),
    { label: "Accessories", to: "/collection", search: { cat: "accessories" } },
    { label: "Bags", to: "/collection", search: { cat: "bags" } },
  ];
}

export function buildNavSales(products: Product[]): NavLink[] {
  const saleProducts = products.filter((p) => p.onSale && p.status === "published");
  const outletCount = products.filter((p) => p.outlet && p.status === "published").length;
  const items: NavLink[] = [
    { label: "All sale pieces", to: "/collection", search: { sale: "true" } },
  ];

  if (outletCount > 0) {
    items.push({ label: "Outlet", to: "/collection", search: { c: "archives" } });
  }

  if (saleProducts.length === 0) {
    items.push({ label: "How it works", to: "/collection", search: { sale: "true" }, hash: "sale-info" });
    return items;
  }

  const seen = new Set<string>();
  for (const product of saleProducts) {
    const slug = product.collectionSlug;
    if (!slug || seen.has(slug) || slug === "archives") continue;
    seen.add(slug);
    items.push({
      label: product.collection,
      to: "/collection",
      search: { sale: "true", c: slug },
    });
  }

  return items;
}

export const NAV_ABOUT: NavLink[] = [
  { label: "La marque", to: "/about" },
  { label: "Artisans & éthique", to: "/about", hash: "artisans" },
  { label: "Matières & qualité", to: "/about", hash: "quality" },
  { label: "Guide d'entretien", to: "/care" },
  { label: "Guide des tailles", to: "/sizing" },
  { label: "Find us", to: "/find-us" },
  { label: "Shipping", to: "/shipping" },
  { label: "Returns", to: "/returns" },
  { label: "Travel Diaries", to: "/travel-diaries" },
  { label: "Contact", to: "/contact" },
];

/** Latest seasonal collection — synced from Shopify `mi-paradisio-collection`. */
export const NAV_NEW_COLLECTION: NavLink[] = [
  { label: "Mi Paradisio 2026", to: "/collection", search: { c: "mi-paradisio-collection" } },
  { label: "Special Occasions", to: "/collection", search: { c: "special-occasions" } },
  { label: "View all new", to: "/collection", search: { c: "mi-paradisio-collection" } },
];

export function buildNavMain(collections: Collection[], products: Product[]) {
  return [
    { label: "New Collection", items: NAV_NEW_COLLECTION },
    { label: "Shop", items: buildNavShop(collections) },
    { label: "Sales", items: buildNavSales(products) },
    { label: "About us", items: NAV_ABOUT },
  ] as const;
}
