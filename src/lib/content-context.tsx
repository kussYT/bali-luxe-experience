import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CmsPage, HomepageContent, JournalPost, SiteContent } from "@/lib/content-types";
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
    travelDiariesPage: {
      eyebrow: "Bingin Diaries Journal",
      title: "Slow notes from Bali & beyond",
      description: "Plages, cafés, moodboards et looks — une dimension lifestyle pour voyager avec la maison.",
    },
  },
};

const FALLBACK_POSTS: JournalPost[] = JOURNAL_ARTICLES.map((a) => ({ ...a }));

type ContentContextValue = {
  site: SiteContent;
  homepage: HomepageContent;
  announcement: SiteContent["announcement"];
  posts: JournalPost[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  fetchPage: (slug: string) => Promise<CmsPage | null>;
};

const ContentContext = createContext<ContentContextValue | null>(null);

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [site, setSite] = useState<SiteContent>(FALLBACK_SITE);
  const [posts, setPosts] = useState<JournalPost[]>(FALLBACK_POSTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageCacheRef = useRef<Record<string, CmsPage>>({});

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [siteRes, postsRes] = await Promise.all([
        fetchJson<{ announcement: SiteContent["announcement"]; homepage: HomepageContent }>("/api/content/site"),
        fetchJson<{ posts: JournalPost[] }>("/api/content/posts"),
      ]);
      setSite({ announcement: siteRes.announcement, homepage: siteRes.homepage });
      setPosts(postsRes.posts);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load content");
      setSite(FALLBACK_SITE);
      setPosts(FALLBACK_POSTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const fetchPage = useCallback(async (slug: string) => {
    if (pageCacheRef.current[slug]) return pageCacheRef.current[slug];
    try {
      const res = await fetchJson<{ page: CmsPage }>(`/api/content/pages/${encodeURIComponent(slug)}`);
      pageCacheRef.current[slug] = res.page;
      return res.page;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      site,
      homepage: site.homepage,
      announcement: site.announcement,
      posts,
      loading,
      error,
      refresh,
      fetchPage,
    }),
    [site, posts, loading, error, refresh, fetchPage],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useSiteContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useSiteContent must be used within ContentProvider");
  return ctx;
}

export async function fetchPublicPost(slug: string): Promise<JournalPost | null> {
  try {
    const res = await fetchJson<{ post: JournalPost }>(`/api/content/posts/${encodeURIComponent(slug)}`);
    return res.post;
  } catch {
    return FALLBACK_POSTS.find((p) => p.slug === slug) ?? null;
  }
}
