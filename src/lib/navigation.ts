export const POPULAR_SEARCHES = [
  "bob",
  "bucket",
  "sand",
  "felted wool",
  "kids",
  "surf hat",
] as const;

export const NAV_SHOP = [
  { label: "View all", to: "/collection" as const },
  { label: "New collection Mi Paradisio", to: "/collection" as const, search: { c: "mi-paradisio" } },
  { label: "New Accessories", to: "/collection" as const, search: { cat: "accessories" } },
  { label: "Bags", to: "/collection" as const, search: { cat: "bags" } },
] as const;

export const NAV_SALES = [{ label: "View all", to: "/collection" as const, search: { sale: "true" } }] as const;

export const NAV_ABOUT = [
  { label: "About us", to: "/about" as const },
  { label: "Atelier", to: "/about" as const, hash: "atelier" },
  { label: "Stockists", to: "/stockists" as const },
  { label: "Shipping", to: "/shipping" as const },
  { label: "Returns", to: "/returns" as const },
  { label: "Travel Diaries", to: "/travel-diaries" as const },
] as const;
