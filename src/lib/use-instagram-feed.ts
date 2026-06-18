import { useEffect, useState } from "react";
import { INSTAGRAM, INSTAGRAM_POSTS, type InstagramPost } from "@/data/instagram-content";
import { sanitizeInstagramPosts } from "@/lib/instagram-utils";

export type InstagramFeed = {
  profile: typeof INSTAGRAM;
  posts: InstagramPost[];
  syncedAt?: string;
  source?: "graph-api" | "oembed" | "static" | "fallback" | string;
  error?: string;
};

const STATIC_FEED: InstagramFeed = {
  profile: INSTAGRAM,
  posts: INSTAGRAM_POSTS,
  source: "fallback",
};

function withSafePosts(data: InstagramFeed): InstagramFeed {
  return { ...data, posts: sanitizeInstagramPosts(data.posts ?? []) };
}

export function useInstagramFeed() {
  const [feed, setFeed] = useState<InstagramFeed>(STATIC_FEED);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/instagram", { cache: "no-store" });
        if (res.ok) {
          const data = withSafePosts((await res.json()) as InstagramFeed);
          if (!cancelled && data.posts.length) {
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
        /* continue */
      }

      try {
        const res = await fetch("/instagram-feed.json", { cache: "no-store" });
        if (res.ok) {
          const data = withSafePosts((await res.json()) as InstagramFeed);
          if (!cancelled && data.posts.length) {
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
        /* continue */
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
