import { IMG } from "@/data/lifestyle-content";
import type { InstagramPost } from "@/data/instagram-content";

const FALLBACK_IMAGES = [
  IMG.lookbook.sunburn,
  IMG.journal.sunset,
  IMG.shopMood,
  IMG.journal.bingin,
  IMG.lookbook.salt,
  IMG.editorial,
];

export function isReliableImageUrl(url: string | undefined) {
  if (!url) return false;
  if (url.startsWith("/")) return true;
  return !url.includes("cdninstagram.com");
}

export function sanitizeInstagramPosts(posts: InstagramPost[]): InstagramPost[] {
  return posts
    .map((post, i) => {
      if (isReliableImageUrl(post.image)) return post;
      return { ...post, image: FALLBACK_IMAGES[i % FALLBACK_IMAGES.length] };
    })
    .filter((p) => p.image);
}
