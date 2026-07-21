import type { Collection, Product } from "@/lib/catalog-types";
import type { MegaMenuFeaturedContent, MegaMenuFeaturedTile } from "@/lib/content-types";
import { PRODUCT_COLLECTIONS, SHOP_CATEGORIES } from "@/lib/catalog-taxonomy";

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
  imageFocal?: import("@/lib/image-focal").ImageFocal;
};

const HIDDEN_NAV_COLLECTION_SLUGS = new Set(["archives", "all-products"]);

export type MegaMenuId = "new-collection" | "shop" | "sales" | "about";

/** New Collection mega-menu — Beatrice layout */
function collectionLabel(collections: Collection[], slug: string, fallback: string) {
  return collections.find((c) => c.slug === slug)?.name?.trim() || fallback;
}

export function buildNavNewCollectionColumns(collections: Collection[] = []): NavColumn[] {
  return [
    {
      title: collectionLabel(collections, "mi-paradisio-collection", "Mi Paradisio"),
      items: [
        {
          label: collectionLabel(collections, "mi-paradisio-collection", "Mi Paradisio"),
          to: "/collection",
          search: { c: "mi-paradisio-collection" },
        },
        {
          label: collectionLabel(collections, "special-occasions", "Wedding Guest"),
          to: "/collection",
          search: { c: "special-occasions" },
        },
        {
          label: "New Accessories",
          to: "/collection",
          search: { c: "mi-paradisio-collection", cat: "accessories" },
        },
      ],
    },
    {
      title: "Discover",
      items: [{ label: "View all", to: "/collection", search: { c: "mi-paradisio-collection" } }],
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

/** Shop mega-menu — Shop · Collections · Shop by category */
export function buildNavShopColumns(collections: Collection[]): NavColumn[] {
  const shopByCategory = SHOP_CATEGORIES.filter((c) => c.slug !== "best-seller");
  const nameBySlug = new Map(collections.map((c) => [c.slug, c.name]));
  return [
    {
      title: "Shop",
      items: [
        { label: "Shop all", to: "/collection" },
        { label: "Best seller", to: "/collection", search: { shop: "best-seller" } },
      ],
    },
    {
      title: "Collections",
      items: PRODUCT_COLLECTIONS.map((c) => ({
        label: nameBySlug.get(c.slug) || c.name,
        to: "/collection",
        search: { c: c.slug },
      })),
    },
    {
      title: "Shop by category",
      items: shopByCategory.map((c) => ({
        label: c.label,
        to: "/collection",
        search: { shop: c.slug },
      })),
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

/** About mega-menu */
export const NAV_ABOUT_COLUMNS: NavColumn[] = [
  {
    title: "Customer care",
    items: [
      { label: "Stockists", to: "/stockists" },
      { label: "Size guide", to: "/sizing" },
      { label: "Care guide", to: "/care" },
      { label: "Shipping", to: "/shipping" },
      { label: "Return policy", to: "/returns" },
      { label: "FAQ", to: "/faq" },
      { label: "Contact us", to: "/contact" },
      { label: "Terms & conditions", to: "/terms" },
    ],
  },
  {
    title: "Explore",
    items: [
      { label: "The brand", to: "/about" },
      { label: "Travel guide", to: "/travel-diaries" },
    ],
  },
  {
    title: "Our values",
    items: [
      { label: "Artisans & ethics", to: "/about", hash: "artisans" },
      { label: "Materials & quality", to: "/about", hash: "quality" },
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

export function buildNavSalesColumns(_products: Product[]): NavColumn[] {
  return [
    {
      title: "Sales",
      items: [{ label: "All sales", to: "/collection", search: { sale: "true" } }],
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

export function buildNavSales(_products: Product[]): NavLink[] {
  return [{ label: "All sales", to: "/collection", search: { sale: "true" } }];
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
    imageFocal: tile.imageFocal,
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
      return { columns: buildNavNewCollectionColumns(collections), featured };
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
    {
      label: labels?.newCollection || "New Collection",
      mega: "new-collection" as const,
      items: buildNavNewCollectionColumns(collections).flatMap((col) => col.items),
    },
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
