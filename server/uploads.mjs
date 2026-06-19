import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { getProjectRoot, requireProjectRoot } from "./runtime-root.mjs";

function guessContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".webm") return "video/webm";
  return "image/jpeg";
}

function objectKey(slug, filename) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const safeSlug = slug.replace(/[^a-zA-Z0-9._/-]/g, "_").replace(/^\/+|\/+$/g, "");
  const key = safeSlug.includes("/") ? `${safeSlug}/${safeName}` : `products/${safeSlug}/${safeName}`;
  return { safeName, key };
}

/** Save product image — local disk in dev, R2 on Cloudflare when UPLOADS binding is set. */
export async function saveUploadedImage(slug, filename, buffer, env) {
  const { safeName, key } = objectKey(slug, filename);

  if (env?.UPLOADS) {
    await env.UPLOADS.put(key, buffer, {
      httpMetadata: { contentType: guessContentType(safeName) },
    });
    return `/uploads/${key}`;
  }

  const root = requireProjectRoot();
  const dir = path.join(root, "public", "uploads", ...key.split("/").slice(0, -1));
  await mkdir(dir, { recursive: true });
  const dest = path.join(root, "public", "uploads", ...key.split("/"));
  await writeFile(dest, buffer);
  return `/uploads/${key}`;
}

/** Serve uploaded image from R2 (production) or local public folder (dev). */
export async function getUploadedImage(keyPath, env) {
  const key = keyPath.replace(/^\/uploads\//, "");

  if (env?.UPLOADS) {
    const obj = await env.UPLOADS.get(key);
    if (!obj) return null;
    const body = await obj.arrayBuffer();
    return {
      body,
      contentType: obj.httpMetadata?.contentType || guessContentType(key),
    };
  }

  const root = getProjectRoot();
  if (!root) return null;

  try {
    const filePath = path.join(root, "public", "uploads", ...key.split("/"));
    const body = await readFile(filePath);
    return { body, contentType: guessContentType(filePath) };
  } catch {
    return null;
  }
}
