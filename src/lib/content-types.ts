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
  linkLabel: string;
  linkHref: string;
};

export type LookbookChapter = {
  title: string;
  caption: string;
  image: string;
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
  href: string;
  search?: Record<string, string>;
};

export type PhotoStripContent = {
  layout: "landscape" | "grid";
  tiles: HomePhotoTile[];
};

export type HomepageContent = {
  hero: HeroContent;
  photoStrip: PhotoStripContent;
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
    alt: string;
    hotspots: MoodHotspot[];
  };
  craft: {
    eyebrow: string;
    title: string;
    items: { title: string; text: string; image: string }[];
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
  travelDiariesPage: {
    eyebrow: string;
    title: string;
    description: string;
  };
};

export type SiteContent = {
  announcement: AnnouncementContent;
  homepage: HomepageContent;
};

export type JournalPost = {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  readMinutes: number;
  body: string[];
  status?: string;
};

export type CmsPage = {
  slug: string;
  title: string;
  eyebrow: string;
  metaDescription: string;
  body: string[];
  status?: string;
};

export type AdminCollectionMeta = {
  slug: string;
  name: string;
  season: string;
  description: string;
  heroImage: string;
  sortOrder: number;
  productCount: number;
  updatedAt?: string;
};
