import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function guessContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

function objectKey(slug, filename) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return { safeName, key: `products/${slug}/${safeName}` };
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

  const dir = path.join(ROOT, "public", "uploads", "products", slug);
  await mkdir(dir, { recursive: true });
  const dest = path.join(dir, safeName);
  await writeFile(dest, buffer);
  return `/uploads/products/${slug}/${safeName}`;
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

  try {
    const filePath = path.join(ROOT, "public", "uploads", key.replace(/^products\//, "products/"));
    const body = await readFile(filePath);
    return { body, contentType: guessContentType(filePath) };
  } catch {
    return null;
  }
}
