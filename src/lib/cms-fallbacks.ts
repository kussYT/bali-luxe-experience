import { BRAND_CONTENT } from "@/data/brand-content";
import { STOCKISTS } from "@/data/stockists";
import { ATLIST_EMBED_URL, ATLIST_MAP_URL } from "@/data/atlist";
import type {
  AboutContent,
  CareContent,
  ContactContent,
  FindUsContent,
  FooterContent,
  ProductMessagesContent,
  SizingContent,
} from "@/lib/content-types";

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

export const FALLBACK_CONTACT: ContactContent = {
  eyebrow: "Get in touch",
  title: "Write to us.",
  metaDescription: "Write to the Bingin Diaries team.",
  description:
    "For special orders, press, wholesale, or simply to say hello — we read every message.",
  email: "info@bingindiaries.com",
  formName: "Name",
  formEmail: "Email",
  formSubject: "Subject",
  formMessage: "Message",
  formSubmit: "Send message",
  formSending: "Sending…",
  formSent: "Message sent — merci",
};

export const FALLBACK_CARE: CareContent = {
  eyebrow: BRAND_CONTENT.care.eyebrow,
  title: BRAND_CONTENT.care.title,
  metaDescription: BRAND_CONTENT.care.intro,
  intro: BRAND_CONTENT.care.intro,
  sections: BRAND_CONTENT.care.sections.map((s) => ({
    title: s.title,
    tips: [...s.tips],
  })),
  backLink: "← Retour à la marque",
};

export const FALLBACK_SIZING: SizingContent = {
  eyebrow: BRAND_CONTENT.sizing.eyebrow,
  title: BRAND_CONTENT.sizing.title,
  metaDescription: "Tailles et ajustements des chapeaux Bingin Diaries.",
  body: [...BRAND_CONTENT.sizing.body],
  image: BRAND_CONTENT.sizing.image,
  imageAlt: "Bingin Diaries size guide",
  backLink: "← Retour à la marque",
};

export const FALLBACK_FOOTER: FooterContent = {
  shopTitle: "Shop",
  shopAll: "All pieces",
  shopSale: "Sale",
  shopWishlist: "Wishlist",
  careTitle: "Customer care",
  contactUs: "Contact us",
  sizeGuide: "Size guide",
  careGuide: "Care guide",
  faq: "FAQ",
  shipping: "Shipping",
  returns: "Return policy",
  exploreTitle: "Explore",
  theBrand: "The brand",
  travelGuide: "Travel guide",
  privacyTitle: "Privacy",
  terms: "Terms & conditions",
  artisans: "Artisans & ethics",
  materials: "Materials & quality",
  copyright: "© 2026 Bingin Diaries",
};

export const FALLBACK_PRODUCT_MESSAGES: ProductMessagesContent = {
  regionalUnavailable:
    "Cette pièce n'est pas disponible pour une livraison en {country}. Le stock pour votre zone est expédié depuis notre atelier {warehouse}. Changez le pays de livraison dans le menu pour voir les pièces proposées dans votre zone.",
  soldOut: "Rupture de stock",
  unavailableInRegion: "Indisponible dans votre région",
  addToBag: "Ajouter au panier",
  inStock: "{count} en stock{variant} — expédié depuis {warehouse}",
};
