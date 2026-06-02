import { useEffect, useState } from "react";
import { INSTAGRAM, INSTAGRAM_POSTS, type InstagramPost } from "@/data/instagram-content";

export type InstagramFeed = {
  profile: typeof INSTAGRAM;
  posts: InstagramPost[];
  syncedAt?: string;
  source?: "graph-api" | "oembed" | "static" | "fallback";
};

const STATIC_FEED: InstagramFeed = {
  profile: INSTAGRAM,
  posts: INSTAGRAM_POSTS,
  source: "fallback",
};

export function useInstagramFeed() {
  const [feed, setFeed] = useState<InstagramFeed>(STATIC_FEED);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/instagram-feed.json", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as InstagramFeed;
          if (!cancelled && data.posts?.length) {
            setFeed({
              profile: { ...INSTAGRAM, ...data.profile },
              posts: data.posts,
              syncedAt: data.syncedAt,
              source: data.source,
            });
            return;
          }
        }
      } catch {
        /* static fallback */
      }

      if (!cancelled) setFeed(STATIC_FEED);
    }

    void load().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { feed, loading };
}
