import { collections } from "@/lib/products";

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

/** Shop dropdown — collections + category filters. */
export const NAV_SHOP: NavLink[] = [
  { label: "View all", to: "/collection" },
  ...collections.map((c) => ({
    label: c.name,
    to: "/collection",
    search: { c: c.slug },
  })),
  { label: "Accessories", to: "/collection", search: { cat: "accessories" } },
  { label: "Bags", to: "/collection", search: { cat: "bags" } },
];

/** Sales dropdown. */
export const NAV_SALES: NavLink[] = [
  { label: "View all sale", to: "/collection", search: { sale: "true" } },
];

/** About dropdown — brand & info pages. */
export const NAV_ABOUT: NavLink[] = [
  { label: "About us", to: "/about" },
  { label: "Atelier", to: "/about", hash: "atelier" },
  { label: "Stockists", to: "/stockists" },
  { label: "Shipping", to: "/shipping" },
  { label: "Returns", to: "/returns" },
  { label: "Travel Diaries", to: "/travel-diaries" },
  { label: "Contact", to: "/contact" },
];

export const NAV_MAIN = [
  { label: "Shop", items: NAV_SHOP },
  { label: "Sales", items: NAV_SALES },
  { label: "About us", items: NAV_ABOUT },
] as const;
