import type { InstagramPost } from "@/data/instagram-content";

export function isReliableImageUrl(url: string | undefined) {
  if (!url) return false;
  if (url.startsWith("/")) return true;
  // Live Graph CDN URLs are OK for immediate display (they expire later; sync localizes them).
  if (url.includes("cdninstagram.com") || url.includes("fbcdn.net")) return true;
  return url.startsWith("http://") || url.startsWith("https://");
}

/** Drop posts with no image; keep local paths and live CDN previews. */
export function sanitizeInstagramPosts(posts: InstagramPost[]): InstagramPost[] {
  return posts.filter((post) => Boolean(post.image));
}
