/** Bundled fallback feed — synced via npm run instagram:sync */
import feed from "../public/instagram-feed.json" with { type: "json" };
import { sanitizeInstagramFeed } from "./instagram-utils.mjs";

export function getStaticInstagramFeed() {
  return sanitizeInstagramFeed(feed);
}
