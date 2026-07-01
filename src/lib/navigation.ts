import type { Collection, Product } from "@/lib/catalog-types";
import type { MegaMenuFeaturedContent, MegaMenuFeaturedTile } from "@/lib/content-types";

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

export type NavColumn = {
  title: string;
  items: NavLink[];
};

export type NavFeaturedImage = {
  label: string;
  to: string;
  search?: Record<string, string>;
  hash?: string;
  image: string;
};

const HIDDEN_NAV_COLLECTION_SLUGS = new Set(["archives", "all-products"]);

export type MegaMenuId = "new-collection" | "shop" | "sales" | "about";

/** New Collection mega-menu. */
export function buildNavNewCollectionColumns(): NavColumn[] {
  return [
    {
      title: "Mi Paradisio 2026",
      items: [
        { label: "Mi Paradisio 2026", to: "/collection", search: { c: "mi-paradisio-collection" } },
        {
          label: "New Accessories",
          to: "/collection",
          search: { c: "mi-paradisio-collection", cat: "accessories" },
        },
        { label: "View all new", to: "/collection", search: { c: "mi-paradisio-collection" } },
      ],
    },
    {
      title: "Discover",
      items: [
        { label: "Special Occasions", to: "/collection", search: { c: "special-occasions" } },
        { label: "Shop all", to: "/collection" },
      ],
    },
  ];
}

export const NAV_NEW_COLLECTION_FEATURED: NavFeaturedImage[] = [
  {
    label: "Mi Paradisio",
    to: "/collection",
    search: { c: "mi-paradisio-collection" },
    image: "/lifestyle/lookbook-sunburn.jpg",
  },
  {
    label: "Special Occasions",
    to: "/collection",
    search: { c: "special-occasions" },
    image: "/lifestyle/journal-sunset.jpg",
  },
];

/** Shop mega-menu — structured by season & category. */
export function buildNavShopColumns(collections: Collection[]): NavColumn[] {
  const collectionLinks = collections
    .filter((c) => !HIDDEN_NAV_COLLECTION_SLUGS.has(c.slug) && c.slug !== "best-sellers" && !c.hidden)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .slice(0, 5)
    .map((c) => ({
      label: c.name,
      to: "/collection",
      search: { c: c.slug },
    }));

  return [
    {
      title: "Shop",
      items: [
        { label: "Shop all", to: "/collection" },
        { label: "Best sellers", to: "/collection", search: { c: "best-sellers" } },
        { label: "Summer hats", to: "/collection", search: { c: "sunburn" } },
        { label: "Winter hats", to: "/collection", search: { c: "fallwinter-2023-2024" } },
        { label: "Rain hats", to: "/collection", search: { q: "rain" } },
      ],
    },
    {
      title: "Categories",
      items: [
        { label: "Accessories", to: "/collection", search: { cat: "accessories" } },
        { label: "Bags", to: "/collection", search: { cat: "bags" } },
        { label: "Knits", to: "/collection", search: { c: "the-knits" } },
        { label: "Kids", to: "/collection", search: { c: "wild-kids" } },
      ],
    },
    {
      title: "Collections",
      items: collectionLinks.length > 0 ? collectionLinks : [{ label: "Mi Paradisio", to: "/collection", search: { c: "mi-paradisio-collection" } }],
    },
  ];
}

export const NAV_SHOP_FEATURED: NavFeaturedImage[] = [
  {
    label: "Summer hats",
    to: "/collection",
    search: { c: "sunburn" },
    image: "/lifestyle/lookbook-sunburn.jpg",
  },
  {
    label: "Best sellers",
    to: "/collection",
    search: { c: "best-sellers" },
    image: "/lifestyle/shop-mood.jpg",
  },
];

/** About mega-menu — aligned with footer columns. */
export const NAV_ABOUT_COLUMNS: NavColumn[] = [
  {
    title: "Customer care",
    items: [
      { label: "Contact us", to: "/contact" },
      { label: "Size guide", to: "/sizing" },
      { label: "Care guide", to: "/care" },
      { label: "FAQ", to: "/faq" },
      { label: "Shipping", to: "/shipping" },
      { label: "Return policy", to: "/returns" },
    ],
  },
  {
    title: "Explore",
    items: [
      { label: "The brand", to: "/about" },
      { label: "Travel guide", to: "/travel-diaries" },
      { label: "Find us", to: "/find-us" },
    ],
  },
  {
    title: "Our values",
    items: [
      { label: "Artisans & ethics", to: "/about", hash: "artisans" },
      { label: "Materials & quality", to: "/about", hash: "quality" },
      { label: "Terms & conditions", to: "/terms" },
    ],
  },
];

export const NAV_ABOUT_FEATURED: NavFeaturedImage[] = [
  { label: "Travel Diaries", to: "/travel-diaries", image: "/lifestyle/lookbook-sunburn.jpg" },
  { label: "The brand", to: "/about", image: "/lifestyle/craft-hands.jpg" },
];

export function buildNavShop(collections: Collection[]): NavLink[] {
  return buildNavShopColumns(collections).flatMap((col) => col.items);
}

export function buildNavSalesColumns(products: Product[]): NavColumn[] {
  const saleProducts = products.filter((p) => p.onSale && p.status === "published");
  const outletCount = products.filter((p) => p.outlet && p.status === "published").length;

  const saleItems: NavLink[] = [{ label: "All sale", to: "/collection", search: { sale: "true" } }];
  if (outletCount > 0) {
    saleItems.push({ label: "Outlet", to: "/collection", search: { c: "archives" } });
  }

  return [
    {
      title: "Sales",
      items: saleItems,
    },
    {
      title: "Info",
      items: [
        {
          label: saleProducts.length === 0 ? "How it works" : "Sale guide",
          to: "/collection",
          search: { sale: "true" },
          hash: "sale-info",
        },
        { label: "Full collection", to: "/collection" },
      ],
    },
  ];
}

export const NAV_SALES_FEATURED: NavFeaturedImage[] = [
  {
    label: "All sale",
    to: "/collection",
    search: { sale: "true" },
    image: "/lifestyle/lookbook-salt.jpg",
  },
  {
    label: "Mi Paradisio",
    to: "/collection",
    search: { c: "mi-paradisio-collection" },
    image: "/lifestyle/shop-mood.jpg",
  },
];

export function buildNavSales(products: Product[]): NavLink[] {
  const saleProducts = products.filter((p) => p.onSale && p.status === "published");
  const outletCount = products.filter((p) => p.outlet && p.status === "published").length;
  const items: NavLink[] = [{ label: "All sale", to: "/collection", search: { sale: "true" } }];

  if (outletCount > 0) {
    items.push({ label: "Outlet", to: "/collection", search: { c: "archives" } });
  }

  if (saleProducts.length === 0) {
    items.push({ label: "How it works", to: "/collection", search: { sale: "true" }, hash: "sale-info" });
  }

  return items;
}

export const NAV_ABOUT: NavLink[] = NAV_ABOUT_COLUMNS.flatMap((col) => col.items);

export const NAV_NEW_COLLECTION: NavLink[] = buildNavNewCollectionColumns().flatMap((col) => col.items);

const MEGA_FEATURED_DEFAULTS: Record<MegaMenuId, NavFeaturedImage[]> = {
  "new-collection": NAV_NEW_COLLECTION_FEATURED,
  shop: NAV_SHOP_FEATURED,
  sales: NAV_SALES_FEATURED,
  about: NAV_ABOUT_FEATURED,
};

export function megaTileToFeatured(tile: MegaMenuFeaturedTile): NavFeaturedImage {
  const search: Record<string, string> = {};
  if (tile.collectionSlug) search.c = tile.collectionSlug;
  if (tile.sale) search.sale = "true";
  return {
    label: tile.label,
    to: tile.to,
    image: tile.image,
    hash: tile.hash,
    search: Object.keys(search).length ? search : undefined,
  };
}

function resolveMegaFeatured(
  id: MegaMenuId,
  override?: MegaMenuFeaturedContent,
): NavFeaturedImage[] {
  const key =
    id === "new-collection" ? "newCollection" : id === "shop" ? "shop" : id === "sales" ? "sales" : "about";
  const tiles = override?.[key];
  if (tiles?.length) {
    return tiles.filter((t) => t.label?.trim() && t.image?.trim()).map(megaTileToFeatured);
  }
  return MEGA_FEATURED_DEFAULTS[id];
}

export function getMegaMenuContent(
  id: MegaMenuId,
  collections: Collection[],
  products: Product[],
  megaMenuFeatured?: MegaMenuFeaturedContent,
): { columns: NavColumn[]; featured: NavFeaturedImage[] } {
  const featured = resolveMegaFeatured(id, megaMenuFeatured);
  switch (id) {
    case "new-collection":
      return { columns: buildNavNewCollectionColumns(), featured };
    case "shop":
      return { columns: buildNavShopColumns(collections), featured };
    case "sales":
      return { columns: buildNavSalesColumns(products), featured };
    case "about":
      return { columns: NAV_ABOUT_COLUMNS, featured };
  }
}

export function buildNavMain(
  collections: Collection[],
  products: Product[],
  labels?: Partial<SiteNavigationContent>,
) {
  return [
    { label: labels?.newCollection || "New Collection", mega: "new-collection" as const, items: NAV_NEW_COLLECTION },
    { label: labels?.shop || "Shop", mega: "shop" as const, items: buildNavShop(collections) },
    { label: labels?.sales || "Sales", mega: "sales" as const, items: buildNavSales(products) },
    { label: labels?.aboutUs || "About us", mega: "about" as const, items: NAV_ABOUT },
  ] as const;
}

export type SiteNavigationContent = {
  newCollection: string;
  shop: string;
  sales: string;
  aboutUs: string;
  popularSearches: string[];
};

export type NavMainSection = ReturnType<typeof buildNavMain>[number];
