/**
 * Re-localise public/instagram-feed.json (sans appeler l'API Graph).
 * Utile quand des URLs CDN Instagram ont expiré.
 *
 * Usage: npm run instagram:refresh
 */
import { config as loadEnv } from "dotenv";
import { writeFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { INSTAGRAM_PROFILE } from "../server/instagram-feed.mjs";
import { localizeFeedImages } from "../server/instagram-localize.mjs";
import { LIFESTYLE_FALLBACK_IMAGES } from "../server/instagram-utils.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "public", "instagram-feed.json");

loadEnv({ path: join(root, ".env.local") });
loadEnv({ path: join(root, ".env") });

const FALLBACK_POSTS = LIFESTYLE_FALLBACK_IMAGES.map((image, i) => ({
  id: `ig-${i + 1}`,
  image,
  alt: "Bingin Diaries",
  permalink: INSTAGRAM_PROFILE.profileUrl,
}));

let feed;
try {
  feed = JSON.parse(await readFile(outPath, "utf8"));
  console.log(`Refreshing existing feed (${feed.source}, ${feed.posts?.length ?? 0} posts)…`);
} catch {
  feed = {
    profile: INSTAGRAM_PROFILE,
    posts: FALLBACK_POSTS,
    source: "static",
  };
  console.log("No feed file — creating lifestyle fallback.");
}

feed = await localizeFeedImages(feed, { root });
feed.syncedAt = new Date().toISOString();

await writeFile(outPath, JSON.stringify(feed, null, 2));
console.log(`Saved ${outPath}`);
console.log(`  Source: ${feed.source}`);
console.log(`  Posts: ${feed.posts.length}`);
console.log(`  Synced: ${feed.syncedAt}`);
