/**
 * Synchronise le feed @bingindiaries vers public/instagram-feed.json
 *
 * Option A — Graph API (recommandé) dans .env.local / .env :
 *   INSTAGRAM_ACCESS_TOKEN=...
 *   INSTAGRAM_USER_ID=...   (optionnel, pour cibler un compte précis)
 *
 * Option B — URLs de posts (oEmbed) :
 *   INSTAGRAM_POST_URLS=https://www.instagram.com/p/XXX/,https://...
 *
 * Usage: npm run instagram:sync
 */
import { config as loadEnv } from "dotenv";
import { writeFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchInstagramFeed, INSTAGRAM_PROFILE } from "../server/instagram-feed.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "public", "instagram-feed.json");

loadEnv({ path: join(root, ".env.local") });
loadEnv({ path: join(root, ".env") });

const FALLBACK_POSTS = [
  { id: "ig-1", image: "/lifestyle/lookbook-sunburn.jpg", alt: "Bingin Diaries", permalink: INSTAGRAM_PROFILE.profileUrl },
  { id: "ig-2", image: "/lifestyle/journal-sunset.jpg", alt: "Golden hour", permalink: INSTAGRAM_PROFILE.profileUrl },
  { id: "ig-3", image: "/lifestyle/shop-mood.jpg", alt: "Editorial mood", permalink: INSTAGRAM_PROFILE.profileUrl },
  { id: "ig-4", image: "/lifestyle/journal-bingin.jpg", alt: "Bingin beach", permalink: INSTAGRAM_PROFILE.profileUrl },
  { id: "ig-5", image: "/lifestyle/lookbook-salt.jpg", alt: "Salt air", permalink: INSTAGRAM_PROFILE.profileUrl },
  { id: "ig-6", image: "/lifestyle/editorial-designed.jpg", alt: "Designed in Bali", permalink: INSTAGRAM_PROFILE.profileUrl },
];

let feed = await fetchInstagramFeed();

if (!feed) {
  console.log("No Graph API / oEmbed data — keeping existing file or using lifestyle fallback.\n");
  try {
    const existing = JSON.parse(await readFile(outPath, "utf8"));
    if (existing.posts?.length && existing.source !== "static") {
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
    console.log("Add INSTAGRAM_ACCESS_TOKEN to .env.local (INSTAGRAM_USER_ID optional) and re-run for live posts.\n");
  }
}

if (feed) {
  await writeFile(outPath, JSON.stringify(feed, null, 2));
  console.log(`Saved ${outPath}`);
  console.log(`  Source: ${feed.source}`);
  console.log(`  Posts: ${feed.posts.length}`);
  console.log(`  Profile: ${feed.profile.profileUrl}`);
}
