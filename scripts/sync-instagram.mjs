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
 */
import { config as loadEnv } from "dotenv";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchInstagramFeed, INSTAGRAM_PROFILE } from "../server/instagram-feed.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "public", "instagram-feed.json");
const imagesDir = join(root, "public", "instagram");

loadEnv({ path: join(root, ".env.local") });
loadEnv({ path: join(root, ".env") });

const LIFESTYLE_IMAGES = [
  "/lifestyle/lookbook-sunburn.jpg",
  "/lifestyle/journal-sunset.jpg",
  "/lifestyle/shop-mood.jpg",
  "/lifestyle/journal-bingin.jpg",
  "/lifestyle/lookbook-salt.jpg",
  "/lifestyle/editorial-designed.jpg",
];

const FALLBACK_POSTS = LIFESTYLE_IMAGES.map((image, i) => ({
  id: `ig-${i + 1}`,
  image,
  alt: "Bingin Diaries",
  permalink: INSTAGRAM_PROFILE.profileUrl,
}));

function isExpiredCdnUrl(url) {
  return typeof url === "string" && url.includes("cdninstagram.com");
}

async function canFetchImage(url) {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return res.ok;
  } catch {
    return false;
  }
}

async function downloadImage(url, destPath) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buf);
}

function localImagePath(id, remoteUrl) {
  const ext = extname(new URL(remoteUrl).pathname) || ".jpg";
  const safe = String(id).replace(/[^a-zA-Z0-9_-]/g, "_");
  return `/instagram/${safe}${ext}`;
}

/** Replace CDN URLs with files in public/instagram/ (or lifestyle fallback). */
async function localizeFeedImages(feed) {
  await mkdir(imagesDir, { recursive: true });
  const posts = [];

  for (let i = 0; i < feed.posts.length; i++) {
    const post = feed.posts[i];
    let image = post.image;

    if (!image || image.startsWith("/")) {
      posts.push(post);
      continue;
    }

    if (isExpiredCdnUrl(image)) {
      const ok = await canFetchImage(image);
      if (!ok) {
        posts.push({
          ...post,
          image: LIFESTYLE_IMAGES[i % LIFESTYLE_IMAGES.length],
        });
        continue;
      }
    }

    try {
      const publicPath = localImagePath(post.id, image);
      const diskPath = join(root, "public", publicPath.replace(/^\//, ""));
      await downloadImage(image, diskPath);
      image = publicPath;
    } catch (e) {
      console.warn(`  skip download ${post.id}: ${e.message}`);
      image = LIFESTYLE_IMAGES[i % LIFESTYLE_IMAGES.length];
    }

    posts.push({ ...post, image });
  }

  return { ...feed, posts, source: feed.source === "graph-api" ? "graph-api-local" : feed.source };
}

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
  feed = await localizeFeedImages(feed);
  feed.syncedAt = new Date().toISOString();
  await writeFile(outPath, JSON.stringify(feed, null, 2));
  console.log(`Saved ${outPath}`);
  console.log(`  Source: ${feed.source}`);
  console.log(`  Posts: ${feed.posts.length}`);
  console.log(`  Profile: ${feed.profile.profileUrl}`);
}
