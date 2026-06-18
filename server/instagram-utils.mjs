/** Lifestyle placeholders when CDN URLs expire. */
export const LIFESTYLE_FALLBACK_IMAGES = [
  "/lifestyle/lookbook-sunburn.jpg",
  "/lifestyle/journal-sunset.jpg",
  "/lifestyle/shop-mood.jpg",
  "/lifestyle/journal-bingin.jpg",
  "/lifestyle/lookbook-salt.jpg",
  "/lifestyle/editorial-designed.jpg",
];

export function isReliableImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("/")) return true;
  return !url.includes("cdninstagram.com");
}

/** Ensure posts only use local or non-expiring image paths. */
export function sanitizeInstagramPosts(posts, fallbackImages = LIFESTYLE_FALLBACK_IMAGES) {
  if (!Array.isArray(posts)) return [];
  return posts
    .map((post, i) => {
      if (isReliableImageUrl(post.image)) return post;
      return {
        ...post,
        image: fallbackImages[i % fallbackImages.length],
      };
    })
    .filter((p) => p.image);
}

export function sanitizeInstagramFeed(feed, fallbackImages = LIFESTYLE_FALLBACK_IMAGES) {
  if (!feed || !Array.isArray(feed.posts)) return feed;
  const posts = sanitizeInstagramPosts(feed.posts, fallbackImages);
  return { ...feed, posts };
}

/** Prefer bundled /instagram/* paths when we already synced a post. */
export function mergeFeedWithLocalImages(liveFeed, staticFeed) {
  if (!liveFeed?.posts?.length) return liveFeed;
  const localById = new Map();
  for (const post of staticFeed?.posts ?? []) {
    if (post?.id && typeof post.image === "string" && post.image.startsWith("/instagram/")) {
      localById.set(post.id, post.image);
    }
  }
  if (localById.size === 0) return liveFeed;
  return {
    ...liveFeed,
    posts: liveFeed.posts.map((post) => ({
      ...post,
      image: localById.get(post.id) ?? post.image,
    })),
  };
}

export function summarizeInstagramFeed(feed) {
  const posts = feed?.posts ?? [];
  const localImages = posts.filter((p) => p.image?.startsWith("/")).length;
  const cdnImages = posts.filter((p) => p.image?.includes("cdninstagram.com")).length;
  return {
    source: feed?.source ?? "none",
    syncedAt: feed?.syncedAt ?? null,
    postCount: posts.length,
    localImages,
    cdnImages,
    needsRefresh: cdnImages > 0,
  };
}
