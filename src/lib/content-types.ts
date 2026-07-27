import type { ImageFocal } from "@/lib/image-focal";
import type { CollectionLocaleFields } from "@/lib/catalog-types";

export type AnnouncementContent = {
  enabled: boolean;
  text: string;
  link: string;
};

export type HeroContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  poster: string;
  posterFocal?: ImageFocal;
  videoSrc: string;
  ctaPrimary: string;
  ctaPrimaryHref: string;
  ctaSecondary: string;
  ctaSecondaryHref: string;
};

export type EditorialContent = {
  sub: string;
  line: string;
  body: string;
  image: string;
  imageFocal?: ImageFocal;
  linkLabel: string;
  linkHref: string;
};

export type LookbookChapter = {
  title: string;
  caption: string;
  image: string;
  imageFocal?: ImageFocal;
  align: "left" | "right";
};

export type MoodHotspot = {
  id: string;
  x: number;
  y: number;
  label: string;
  productSlug?: string;
  collectionSearch?: Record<string, string>;
};

export type HomePhotoTile = {
  label: string;
  image: string;
  imageFocal?: ImageFocal;
  href: string;
  search?: Record<string, string>;
};

export type PhotoStripContent = {
  layout: "landscape" | "grid";
  tiles: HomePhotoTile[];
};

export type SpotlightProductContent = {
  enabled: boolean;
  productSlug: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageFocal?: ImageFocal;
  ctaLabel: string;
};

export type SiteNavigationContent = {
  newCollection: string;
  shop: string;
  sales: string;
  aboutUs: string;
  popularSearches: string[];
};

export type SiteNavigationLocaleFields = SiteNavigationContent;

export type SiteNavigationStored = {
  locales?: Partial<Record<import("@/lib/i18n/messages").Locale, SiteNavigationLocaleFields>>;
} & Partial<SiteNavigationContent>;

/** Right-hand images in desktop mega-menu (À propos, Boutique, etc.). */
export type MegaMenuFeaturedTile = {
  label: string;
  to: string;
  image: string;
  imageFocal?: ImageFocal;
  /** Fills ?c= on /collection */
  collectionSlug?: string;
  hash?: string;
  /** Fills ?sale=true */
  sale?: boolean;
};

export type MegaMenuFeaturedContent = {
  newCollection: MegaMenuFeaturedTile[];
  shop: MegaMenuFeaturedTile[];
  sales: MegaMenuFeaturedTile[];
  about: MegaMenuFeaturedTile[];
};

export type HomepageContent = {
  hero: HeroContent;
  photoStrip: PhotoStripContent;
  spotlightProduct: SpotlightProductContent;
  navigation: SiteNavigationContent;
  /** Full stored navigation (locales) — admin API only */
  navigationStored?: SiteNavigationStored;
  megaMenuFeatured?: MegaMenuFeaturedContent;
  editorial: EditorialContent;
  featuredSection: { eyebrow: string; title: string };
  lookbook: {
    eyebrow: string;
    title: string;
    linkLabel: string;
    chapters: LookbookChapter[];
  };
  shopTheMood: {
    image: string;
    imageFocal?: ImageFocal;
    alt: string;
    hotspots: MoodHotspot[];
  };
  craft: {
    eyebrow: string;
    title: string;
    items: { title: string; text: string; image: string; imageFocal?: ImageFocal }[];
  };
  quote: { text: string; attribution: string };
  journalSection: { eyebrow: string; title: string };
  binginSounds: {
    title: string;
    playlistName: string;
    description: string;
    spotifyUrl: string;
    spotifyPlaylistId: string;
  };
  /** Looping audio for the fixed Sound on/off control (not Spotify). */
  ambientSound: {
    audioSrc: string;
  };
  travelDiariesPage: {
    eyebrow: string;
    title: string;
    description: string;
  };
  /** Google search result title + description for homepage */
  seo: {
    title: string;
    metaDescription: string;
  };
};

export type AboutSection = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
};

export type AboutValue = {
  n: string;
  t: string;
  d: string;
};

export type AboutSidebarLink = {
  label: string;
  to: string;
  hash?: string;
  image: string;
  imageFocal?: ImageFocal;
};

export type AboutContent = {
  eyebrow: string;
  title: string;
  metaDescription: string;
  youtubeId: string;
  sections: AboutSection[];
  values: AboutValue[];
  sidebarLinks: AboutSidebarLink[];
};

export type AboutLocaleFields = {
  eyebrow: string;
  title: string;
  metaDescription: string;
  sections: AboutSection[];
  values: AboutValue[];
  sidebarLinks: AboutSidebarLink[];
};

/** About page as stored in CMS (shared YouTube + per-locale copy). */
export type AboutStored = {
  youtubeId: string;
  locales: Partial<Record<import("@/lib/i18n/messages").Locale, AboutLocaleFields>>;
};

export type StockistStore = {
  name: string;
  instagram?: string;
  url?: string;
};

export type StockistArea = {
  name: string;
  stores: StockistStore[];
};

export type StockistCountry = {
  country: string;
  areas: StockistArea[];
};

export type FindUsContent = {
  eyebrow: string;
  title: string;
  metaDescription: string;
  description: string;
  atlistEmbedUrl: string;
  atlistMapUrl: string;
  wholesaleEmail: string;
  wholesaleTitle: string;
  wholesaleCtaLabel: string;
  showStockistList: boolean;
  countries: StockistCountry[];
};

export type ContactContent = {
  eyebrow: string;
  title: string;
  metaDescription: string;
  description: string;
  email: string;
  formName: string;
  formEmail: string;
  formSubject: string;
  formMessage: string;
  formSubmit: string;
  formSending: string;
  formSent: string;
};

export type CareSectionContent = {
  title: string;
  tips: string[];
};

export type CareImageContent = {
  src: string;
  alt: string;
};

export type CareContent = {
  eyebrow: string;
  title: string;
  metaDescription: string;
  intro: string;
  images: CareImageContent[];
  sections: CareSectionContent[];
  backLink: string;
};

export type SizingContent = {
  eyebrow: string;
  title: string;
  metaDescription: string;
  body: string[];
  image: string;
  imageFocal?: ImageFocal;
  imageAlt: string;
  backLink: string;
};

export type SizingLocaleFields = {
  eyebrow: string;
  title: string;
  metaDescription: string;
  body: string[];
  imageAlt: string;
  backLink: string;
};

/** Size guide as stored in CMS (shared image + per-locale copy). */
export type SizingStored = {
  image: string;
  imageFocal?: ImageFocal;
  locales: Partial<Record<import("@/lib/i18n/messages").Locale, SizingLocaleFields>>;
};

export type FooterContent = {
  shopTitle: string;
  shopAll: string;
  shopSale: string;
  shopWishlist: string;
  careTitle: string;
  contactUs: string;
  sizeGuide: string;
  careGuide: string;
  faq: string;
  shipping: string;
  returns: string;
  exploreTitle: string;
  theBrand: string;
  travelGuide: string;
  privacyTitle: string;
  terms: string;
  artisans: string;
  materials: string;
  copyright: string;
};

export type ProductMessagesLocaleFields = {
  regionalUnavailable: string;
  soldOut: string;
  unavailableInRegion: string;
  addToBag: string;
  inStock: string;
};

/** Resolved copy for one locale (storefront). */
export type ProductMessagesContent = ProductMessagesLocaleFields;

/** All locales as stored in CMS settings. */
export type ProductMessagesStored = {
  locales: Partial<Record<import("@/lib/i18n/messages").Locale, ProductMessagesLocaleFields>>;
};

export type SiteContent = {
  announcement: AnnouncementContent;
  homepage: HomepageContent;
  about: AboutContent;
  findUs: FindUsContent;
  contact: ContactContent;
  care: CareContent;
  sizing: SizingContent;
  footer: FooterContent;
  productMessages: ProductMessagesContent;
};

export type JournalPostLocaleFields = {
  title: string;
  excerpt: string;
  category: string;
  body: string[];
  blocks?: JournalPostBlock[];
};

export type JournalPhotoSlot = {
  image: string;
  caption?: string;
  alt?: string;
  imageFocal?: ImageFocal;
};

export type JournalPostBlock =
  | { type: "text"; paragraphs: string[] }
  | ({ type: "photo" } & JournalPhotoSlot)
  | { type: "photoPair"; left: JournalPhotoSlot; right: JournalPhotoSlot };

export type JournalPost = {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  imageFocal?: ImageFocal;
  category: string;
  readMinutes: number;
  body: string[];
  blocks?: JournalPostBlock[];
  status?: string;
  /** All translations — present in admin API responses */
  locales?: Partial<Record<import("@/lib/i18n/messages").Locale, JournalPostLocaleFields>>;
};

export type CmsPageLocaleFields = {
  title: string;
  eyebrow: string;
  metaDescription: string;
  body: string[];
};

export type CmsPage = {
  slug: string;
  title: string;
  eyebrow: string;
  metaDescription: string;
  body: string[];
  status?: string;
  /** All translations — present in admin API responses */
  locales?: Partial<Record<import("@/lib/i18n/messages").Locale, CmsPageLocaleFields>>;
};

export type AdminCollectionMeta = {
  slug: string;
  name: string;
  season: string;
  description: string;
  heroImage: string;
  sortOrder: number;
  hidden: boolean;
  productCount: number;
  updatedAt?: string;
  locales?: Partial<Record<import("@/lib/i18n/messages").Locale, CollectionLocaleFields>>;
};
