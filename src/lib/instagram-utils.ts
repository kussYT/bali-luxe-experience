import type { InstagramPost } from "@/data/instagram-content";

export function isReliableImageUrl(url: string | undefined) {
  if (!url) return false;
  if (url.startsWith("/")) return true;
  return url.startsWith("http://") || url.startsWith("https://");
}

/** Drop posts without a usable image — keep live CDN URLs (server merges local paths when synced). */
export function sanitizeInstagramPosts(posts: InstagramPost[]): InstagramPost[] {
  return posts.filter((post) => isReliableImageUrl(post.image));
}
