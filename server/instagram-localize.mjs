import { writeFile, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { LIFESTYLE_FALLBACK_IMAGES } from "./instagram-utils.mjs";

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

/**
 * Download remote images to public/instagram/ or swap to lifestyle fallbacks.
 * @param {object} feed
 * @param {{ root: string, imagesDir?: string }} opts
 */
export async function localizeFeedImages(feed, { root, imagesDir }) {
  const dir = imagesDir ?? join(root, "public", "instagram");
  await mkdir(dir, { recursive: true });
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
          image: LIFESTYLE_FALLBACK_IMAGES[i % LIFESTYLE_FALLBACK_IMAGES.length],
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
      image = LIFESTYLE_FALLBACK_IMAGES[i % LIFESTYLE_FALLBACK_IMAGES.length];
    }

    posts.push({ ...post, image });
  }

  const source =
    feed.source === "graph-api" || feed.source === "oembed"
      ? `${feed.source}-local`
      : feed.source;

  return { ...feed, posts, source };
}
