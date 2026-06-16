import { useEffect, useState } from "react";
import { INSTAGRAM, INSTAGRAM_POSTS, type InstagramPost } from "@/data/instagram-content";

export type InstagramFeed = {
  profile: typeof INSTAGRAM;
  posts: InstagramPost[];
  syncedAt?: string;
  source?: "graph-api" | "oembed" | "static" | "fallback";
  error?: string;
};

const STATIC_FEED: InstagramFeed = {
  profile: INSTAGRAM,
  posts: INSTAGRAM_POSTS,
  source: "fallback",
};

export function useInstagramFeed() {
  const [feed, setFeed] = useState<InstagramFeed>(STATIC_FEED);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // 1) server API (token stays server-side)
      try {
        const res = await fetch("/api/instagram", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as InstagramFeed;
          if (!cancelled && data.posts?.length) {
            setFeed({
              profile: { ...INSTAGRAM, ...data.profile },
              posts: data.posts,
              syncedAt: data.syncedAt,
              source: data.source,
              error: data.error,
            });
            setError(data.error ?? null);
            return;
          }
        }
      } catch {
        /* continue to static-file fallback */
      }

      // 2) static public JSON fallback
      try {
        const res = await fetch("/instagram-feed.json", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as InstagramFeed;
          if (!cancelled && data.posts?.length) {
            setFeed({
              profile: { ...INSTAGRAM, ...data.profile },
              posts: data.posts,
              syncedAt: data.syncedAt,
              source: data.source || "static",
            });
            setError("Instagram live feed unavailable. Showing curated posts.");
            return;
          }
        }
      } catch {
        /* continue to local fallback */
      }

      if (!cancelled) {
        setFeed(STATIC_FEED);
        setError("Instagram feed unavailable. Showing fallback content.");
      }
    }

    void load().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { feed, loading, error };
}
