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
 * Env:
 *   INSTAGRAM_SYNC_STRICT=1 — exit 1 if Graph/oEmbed fetch fails (CI)
 */
import { config as loadEnv } from "dotenv";
import { writeFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchInstagramFromGraph,
  fetchInstagramFromOEmbed,
  INSTAGRAM_PROFILE,
} from "../server/instagram-feed.mjs";
import { localizeFeedImages } from "../server/instagram-localize.mjs";
import { LIFESTYLE_FALLBACK_IMAGES } from "../server/instagram-utils.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "public", "instagram-feed.json");
const strict = process.env.INSTAGRAM_SYNC_STRICT === "1" || process.env.CI === "true";

loadEnv({ path: join(root, ".env.local") });
loadEnv({ path: join(root, ".env") });

const FALLBACK_POSTS = LIFESTYLE_FALLBACK_IMAGES.map((image, i) => ({
  id: `ig-${i + 1}`,
  image,
  alt: "Bingin Diaries",
  permalink: INSTAGRAM_PROFILE.profileUrl,
}));

const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
if (!token) {
  console.error("Missing INSTAGRAM_ACCESS_TOKEN — cannot sync live posts.");
  if (strict) process.exit(1);
}

let graphError = null;
let feed = null;

if (token) {
  try {
    feed = await fetchInstagramFromGraph();
  } catch (e) {
    graphError = e;
    const cause = e.cause?.code || e.cause?.message || "";
    console.warn(`[instagram] Graph API failed: ${e.message}${cause ? ` (${cause})` : ""}`);
  }
}

if (!feed) {
  const urls = process.env.INSTAGRAM_POST_URLS?.split(",").filter(Boolean);
  if (urls?.length) {
    try {
      feed = await fetchInstagramFromOEmbed(urls);
    } catch (e) {
      console.warn("[instagram oembed]", e.message);
    }
  }
}

if (!feed) {
  console.log("No Graph API / oEmbed data — keeping existing file or using lifestyle fallback.\n");
  if (strict && token) {
    console.error(
      "Strict sync mode: refusing to publish a stale feed while a token is configured.",
    );
    if (graphError) {
      console.error("Last Graph error:", graphError.message);
      if (graphError.cause) console.error("Cause:", graphError.cause);
    }
    console.error(
      "Fix: refresh INSTAGRAM_ACCESS_TOKEN in GitHub + Cloudflare secrets (Meta Developers), then re-run the workflow.",
    );
    process.exit(1);
  }
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
