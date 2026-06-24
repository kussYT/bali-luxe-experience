import { BRAND_CONTENT } from "@/data/brand-content";
import { STOCKISTS } from "@/data/stockists";
import { ATLIST_EMBED_URL, ATLIST_MAP_URL } from "@/data/atlist";
import type { AboutContent, FindUsContent } from "@/lib/content-types";

export const DEFAULT_ABOUT_SIDEBAR: AboutContent["sidebarLinks"] = [
  { label: "La marque", to: "/about", hash: "vision", image: "/lifestyle/craft-hands.jpg" },
  { label: "Artisans & éthique", to: "/about", hash: "artisans", image: "/lifestyle/craft-fabric.jpg" },
  { label: "Matières & qualité", to: "/about", hash: "quality", image: "/lifestyle/editorial-designed.jpg" },
  { label: "Guide d'entretien", to: "/care", image: "/lifestyle/craft-travel.jpg" },
  { label: "Guide des tailles", to: "/sizing", image: "/lifestyle/journal-bingin.jpg" },
  { label: "Find us", to: "/find-us", image: "/lifestyle/shop-mood.jpg" },
  { label: "Shipping", to: "/shipping", image: "/lifestyle/lookbook-salt.jpg" },
  { label: "Returns", to: "/returns", image: "/lifestyle/journal-sunset.jpg" },
  { label: "Travel Diaries", to: "/travel-diaries", image: "/lifestyle/lookbook-sunburn.jpg" },
  { label: "Contact", to: "/contact", image: "/lifestyle/lookbook-riviera.jpg" },
];

export const FALLBACK_ABOUT: AboutContent = {
  eyebrow: BRAND_CONTENT.about.eyebrow,
  title: BRAND_CONTENT.about.title,
  metaDescription:
    "L'histoire de Bingin Diaries — chapeaux artisanaux entre Bali, le Portugal et la France.",
  youtubeId: BRAND_CONTENT.about.youtubeId,
  sections: BRAND_CONTENT.about.sections.map((s) => ({ ...s })),
  values: BRAND_CONTENT.about.values.map((v) => ({ ...v })),
  sidebarLinks: DEFAULT_ABOUT_SIDEBAR.map((l) => ({ ...l })),
};

export const FALLBACK_FIND_US: FindUsContent = {
  eyebrow: "Retailers",
  title: "Find us",
  metaDescription: "Find Bingin Diaries at select boutiques in Bali, France, Spain, Finland and more.",
  description:
    "Discover Bingin Diaries at select boutiques around the world — from Bali to Europe and beyond.",
  atlistEmbedUrl: ATLIST_EMBED_URL,
  atlistMapUrl: ATLIST_MAP_URL,
  wholesaleEmail: STOCKISTS.wholesaleEmail,
  wholesaleTitle: "You are a retailer and want to work with us?",
  wholesaleCtaLabel: "Contact the house",
  showStockistList: true,
  countries: STOCKISTS.countries.map((c) => ({
    country: c.country,
    areas: c.areas.map((a) => ({
      name: a.name,
      stores: a.stores.map((s) => ({ ...s })),
    })),
  })),
};
