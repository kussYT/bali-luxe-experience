import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CmsPage, HomepageContent, JournalPost, SiteContent } from "@/lib/content-types";
import { useLocale } from "@/lib/i18n/locale-context";
import { FALLBACK_ABOUT, FALLBACK_FIND_US, FALLBACK_CONTACT, FALLBACK_CARE, FALLBACK_SIZING, FALLBACK_FOOTER, FALLBACK_PRODUCT_MESSAGES } from "@/lib/cms-fallbacks";
import {
  BINGIN_SOUNDS,
  CRAFT_DETAILS,
  EDITORIAL_FEATURE,
  HERO_TAGLINE,
  HERO_VIDEO_SRC,
  IMG,
  JOURNAL_ARTICLES,
  LOOKBOOK_CHAPTERS,
  SHOP_THE_MOOD,
} from "@/data/lifestyle-content";

const PENDING_SITE: SiteContent = {
  announcement: { enabled: false, text: "", link: "" },
  homepage: {
    hero: {
      eyebrow: "",
      title: "",
      subtitle: "",
      poster: "",
      videoSrc: "",
      ctaPrimary: "",
      ctaPrimaryHref: "/collection",
      ctaSecondary: "",
      ctaSecondaryHref: "/travel-diaries",
    },
    editorial: {
      sub: "",
      line: "",
      body: "",
      image: "",
      linkLabel: "",
      linkHref: "/about",
    },
    featuredSection: { eyebrow: "", title: "" },
    spotlightProduct: {
      enabled: false,
      productSlug: "",
      eyebrow: "",
      title: "",
      description: "",
      image: "",
      ctaLabel: "",
    },
    navigation: {
      newCollection: "",
      shop: "",
      sales: "",
      aboutUs: "",
      popularSearches: [],
    },
    photoStrip: { layout: "grid", tiles: [] },
    lookbook: { eyebrow: "", title: "", linkLabel: "", chapters: [] },
    shopTheMood: { image: "", alt: "", hotspots: [] },
    craft: { eyebrow: "", title: "", items: [] },
    quote: { text: "", attribution: "" },
    journalSection: { eyebrow: "", title: "" },
    binginSounds: {
      title: "",
      playlistName: "",
      description: "",
      spotifyUrl: "",
      spotifyPlaylistId: "",
    },
    ambientSound: { audioSrc: "" },
    travelDiariesPage: { eyebrow: "", title: "", description: "" },
    seo: { title: "Bingin Diaries", metaDescription: "" },
  },
  about: FALLBACK_ABOUT,
  findUs: FALLBACK_FIND_US,
  contact: FALLBACK_CONTACT,
  care: FALLBACK_CARE,
  sizing: FALLBACK_SIZING,
  footer: FALLBACK_FOOTER,
  productMessages: FALLBACK_PRODUCT_MESSAGES,
};

const FALLBACK_SITE: SiteContent = {
  announcement: {
    enabled: true,
    text: "Slow-made between Bali & France — Complimentary shipping over €150 — Fall / Winter 2026",
    link: "",
  },
  homepage: {
    hero: {
      eyebrow: "Bingin Diaries · Bali & France",
      title: HERO_TAGLINE,
      subtitle: "Bali stories, worn everywhere — slow fashion for sun, travel, and the art of living lightly.",
      poster: IMG.hero,
      videoSrc: HERO_VIDEO_SRC,
      ctaPrimary: "Shop the collection",
      ctaPrimaryHref: "/collection",
      ctaSecondary: "Explore the journal",
      ctaSecondaryHref: "/travel-diaries",
    },
    editorial: {
      sub: EDITORIAL_FEATURE.sub,
      line: EDITORIAL_FEATURE.line,
      body: EDITORIAL_FEATURE.body,
      image: EDITORIAL_FEATURE.image,
      linkLabel: "Our story",
      linkHref: "/about",
    },
    featuredSection: { eyebrow: "Curated", title: "Pieces of the season" },
    spotlightProduct: {
      enabled: false,
      productSlug: "",
      eyebrow: "Spotlight",
      title: "",
      description: "",
      image: "",
      ctaLabel: "Discover the piece",
    },
    navigation: {
      newCollection: "",
      shop: "",
      sales: "",
      aboutUs: "",
      popularSearches: [],
    },
    photoStrip: {
      layout: "grid",
      tiles: [
        {
          label: "Mi Paradisio",
          image: IMG.lookbook.sunburn,
          href: "/collection",
          search: { c: "mi-paradisio-collection" },
        },
        {
          label: "Sunburn",
          image: IMG.lookbook.salt,
          href: "/collection",
          search: { c: "sunburn" },
        },
        {
          label: "The Rimba",
          image: IMG.journal.sunset,
          href: "/collection",
          search: { c: "the-rimba" },
        },
      ],
    },
    lookbook: {
      eyebrow: "Bali Chapters",
      title: "Summer stories",
      linkLabel: "Shop the look",
      chapters: LOOKBOOK_CHAPTERS.map((c) => ({ ...c })),
    },
    shopTheMood: {
      image: SHOP_THE_MOOD.image,
      alt: SHOP_THE_MOOD.alt,
      hotspots: SHOP_THE_MOOD.hotspots.map((h) => ({ ...h })),
    },
    craft: {
      eyebrow: "Craft & material",
      title: "The details that matter",
      items: CRAFT_DETAILS.map((c) => ({ ...c })),
    },
    quote: {
      text: "Each piece carries the memory of the hands that made it — a small diary of sun, salt, and slow time.",
      attribution: "The atelier · Bali & France",
    },
    journalSection: { eyebrow: "Bingin Diaries Journal", title: "Travel & slow living" },
    binginSounds: { ...BINGIN_SOUNDS },
    ambientSound: { audioSrc: "/audio/ambient.mp3" },
    travelDiariesPage: {
      eyebrow: "Bingin Diaries Journal",
      title: "Slow notes from Bali & beyond",
      description: "Plages, cafés, moodboards et looks — une dimension lifestyle pour voyager avec la maison.",
    },
    seo: {
      title: "Bingin Diaries — Hand-woven hats from Bali & France",
      metaDescription:
        "A boutique house of sun-soaked hats, hand-woven between Canggu and Paris.",
    },
  },
  about: FALLBACK_ABOUT,
  findUs: FALLBACK_FIND_US,
  contact: FALLBACK_CONTACT,
  care: FALLBACK_CARE,
  sizing: FALLBACK_SIZING,
  footer: FALLBACK_FOOTER,
  productMessages: FALLBACK_PRODUCT_MESSAGES,
};

const FALLBACK_POSTS: JournalPost[] = JOURNAL_ARTICLES.map((a) => ({ ...a }));

type ContentContextValue = {
  site: SiteContent;
  homepage: HomepageContent;
  announcement: SiteContent["announcement"];
  about: SiteContent["about"];
  findUs: SiteContent["findUs"];
  contact: SiteContent["contact"];
  care: SiteContent["care"];
  sizing: SiteContent["sizing"];
  footer: SiteContent["footer"];
  productMessages: SiteContent["productMessages"];
  posts: JournalPost[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  fetchPage: (slug: string, locale?: string) => Promise<CmsPage | null>;
  fetchPost: (slug: string, locale?: string) => Promise<JournalPost | null>;
};

const ContentContext = createContext<ContentContextValue | null>(null);

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const [site, setSite] = useState<SiteContent>(PENDING_SITE);
  const [posts, setPosts] = useState<JournalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageCacheRef = useRef<Record<string, CmsPage>>({});
  const postCacheRef = useRef<Record<string, JournalPost>>({});

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const postsQs = `?locale=${encodeURIComponent(locale)}`;
      const [siteRes, postsRes] = await Promise.all([
        fetchJson<{
          announcement: SiteContent["announcement"];
          homepage: HomepageContent;
          about: SiteContent["about"];
          findUs: SiteContent["findUs"];
          contact: SiteContent["contact"];
          care: SiteContent["care"];
          sizing: SiteContent["sizing"];
          footer: SiteContent["footer"];
          productMessages: SiteContent["productMessages"];
        }>("/api/content/site"),
        fetchJson<{ posts: JournalPost[] }>(`/api/content/posts${postsQs}`),
      ]);
      setSite({
        announcement: siteRes.announcement,
        homepage: siteRes.homepage,
        about: siteRes.about,
        findUs: siteRes.findUs,
        contact: siteRes.contact,
        care: siteRes.care,
        sizing: siteRes.sizing,
        footer: siteRes.footer,
        productMessages: siteRes.productMessages,
      });
      setPosts(postsRes.posts);
      postCacheRef.current = {};
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load content");
      setSite(FALLBACK_SITE);
      setPosts(FALLBACK_POSTS);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const fetchPage = useCallback(async (slug: string, pageLocale = locale) => {
    const cacheKey = `${slug}:${pageLocale}`;
    if (pageCacheRef.current[cacheKey]) return pageCacheRef.current[cacheKey];
    try {
      const qs = pageLocale ? `?locale=${encodeURIComponent(pageLocale)}` : "";
      const res = await fetchJson<{ page: CmsPage }>(
        `/api/content/pages/${encodeURIComponent(slug)}${qs}`,
      );
      pageCacheRef.current[cacheKey] = res.page;
      return res.page;
    } catch {
      return null;
    }
  }, [locale]);

  const fetchPost = useCallback(async (slug: string, postLocale = locale) => {
    const cacheKey = `${slug}:${postLocale}`;
    if (postCacheRef.current[cacheKey]) return postCacheRef.current[cacheKey];
    try {
      const qs = postLocale ? `?locale=${encodeURIComponent(postLocale)}` : "";
      const res = await fetchJson<{ post: JournalPost }>(
        `/api/content/posts/${encodeURIComponent(slug)}${qs}`,
      );
      postCacheRef.current[cacheKey] = res.post;
      return res.post;
    } catch {
      return FALLBACK_POSTS.find((p) => p.slug === slug) ?? null;
    }
  }, [locale]);

  const value = useMemo(
    () => ({
      site,
      homepage: site.homepage,
      announcement: site.announcement,
      about: site.about,
      findUs: site.findUs,
      contact: site.contact,
      care: site.care,
      sizing: site.sizing,
      footer: site.footer,
      productMessages: site.productMessages,
      posts,
      loading,
      error,
      refresh,
      fetchPage,
      fetchPost,
    }),
    [site, posts, loading, error, refresh, fetchPage, fetchPost],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useSiteContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useSiteContent must be used within ContentProvider");
  return ctx;
}

export async function fetchPublicPost(slug: string, locale = "en"): Promise<JournalPost | null> {
  try {
    const qs = locale ? `?locale=${encodeURIComponent(locale)}` : "";
    const res = await fetchJson<{ post: JournalPost }>(
      `/api/content/posts/${encodeURIComponent(slug)}${qs}`,
    );
    return res.post;
  } catch {
    return FALLBACK_POSTS.find((p) => p.slug === slug) ?? null;
  }
}
