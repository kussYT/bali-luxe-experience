/**
 * Synchronise le feed @bingindiaries vers public/instagram-feed.json
 * Télécharge les images en local (public/instagram/) — les URLs CDN Instagram expirent en quelques jours.
 *
 * Option A — Graph API (recommandé) dans .env.local / .env :
 *   INSTAGRAM_ACCESS_TOKEN=...
 *   INSTAGRAM_USER_ID=...   (optionnel)
 *
 * Option B — URLs de posts (oEmbed) :
 *   INSTAGRAM_POST_URLS=https://www.instagram.com/p/XXX/,https://...
 *
 * Usage: npm run instagram:sync
 * Refresh sans API: npm run instagram:refresh
 */
import { config as loadEnv } from "dotenv";
import { writeFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchInstagramFeed, INSTAGRAM_PROFILE } from "../server/instagram-feed.mjs";
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

let feed = await fetchInstagramFeed();

if (!feed) {
  console.log("No Graph API / oEmbed data — keeping existing file or using lifestyle fallback.\n");
  try {
    const existing = JSON.parse(await readFile(outPath, "utf8"));
    if (existing.posts?.length) {
      feed = existing;
      console.log(`Using existing feed (${existing.source}, ${existing.posts.length} posts).`);
    }
  } catch {
    feed = {
      profile: INSTAGRAM_PROFILE,
      posts: FALLBACK_POSTS,
      syncedAt: new Date().toISOString(),
      source: "static",
    };
    console.log("Created static fallback (lifestyle images).");
    console.log("Add INSTAGRAM_ACCESS_TOKEN to .env.local and re-run for live posts.\n");
  }
}

if (feed) {
  feed = await localizeFeedImages(feed, { root });
  feed.syncedAt = new Date().toISOString();
  await writeFile(outPath, JSON.stringify(feed, null, 2));
  console.log(`Saved ${outPath}`);
  console.log(`  Source: ${feed.source}`);
  console.log(`  Posts: ${feed.posts.length}`);
  console.log(`  Profile: ${feed.profile.profileUrl}`);
}
