import type { InstagramPost } from "@/data/instagram-content";

const LIFESTYLE_FALLBACKS = [
  "/lifestyle/lookbook-sunburn.jpg",
  "/lifestyle/journal-sunset.jpg",
  "/lifestyle/shop-mood.jpg",
  "/lifestyle/journal-bingin.jpg",
  "/lifestyle/lookbook-salt.jpg",
  "/lifestyle/editorial-designed.jpg",
];

export function isReliableImageUrl(url: string | undefined) {
  if (!url) return false;
  if (url.startsWith("/")) return true;
  if (url.includes("cdninstagram.com")) return false;
  return url.startsWith("http://") || url.startsWith("https://");
}

/** Prefer local/synced paths; swap expired Instagram CDN URLs for lifestyle fallbacks. */
export function sanitizeInstagramPosts(posts: InstagramPost[]): InstagramPost[] {
  return posts
    .map((post, i) => {
      if (isReliableImageUrl(post.image)) return post;
      return { ...post, image: LIFESTYLE_FALLBACKS[i % LIFESTYLE_FALLBACKS.length] };
    })
    .filter((post) => post.image);
}
