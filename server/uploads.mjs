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

function uploadsUnavailableError() {
  const err = new Error("Media uploads not available until R2 is enabled");
  err.status = 503;
  return err;
}

/** Where uploads are stored in this runtime (for admin diagnostics). */
export function getUploadsStorageMode(env) {
  if (env?.UPLOADS) return "r2";
  if (getProjectRoot()) return "filesystem";
  return "unavailable";
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

  if (!getProjectRoot()) throw uploadsUnavailableError();

  const root = requireProjectRoot();
  const dir = path.join(root, "public", "uploads", ...key.split("/").slice(0, -1));
  await mkdir(dir, { recursive: true });
  const dest = path.join(root, "public", "uploads", ...key.split("/"));
  await writeFile(dest, buffer);
  return `/uploads/${key}`;
}

function parseRangeHeader(rangeHeader, size) {
  const match = /^bytes=(\d+)-(\d*)$/i.exec(rangeHeader ?? "");
  if (!match) return null;
  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : size - 1;
  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) return null;
  return { start, end: Math.min(end, size - 1), length: Math.min(end, size - 1) - start + 1 };
}

function uploadResponseHeaders(contentType, size, extra = {}) {
  return {
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    ...extra,
  };
}

/** Serve uploaded file from R2 (production) or local public folder (dev), with HTTP Range for video. */
export async function serveUploadedFile(keyPath, env, request) {
  const key = keyPath.replace(/^\/uploads\//, "");
  const contentTypeFromKey = guessContentType(key);

  if (env?.UPLOADS) {
    const head = await env.UPLOADS.head(key);
    if (!head) return null;
    const size = head.size;
    const contentType = head.httpMetadata?.contentType || contentTypeFromKey;
    const range = parseRangeHeader(request?.headers?.get("Range"), size);

    if (range) {
      const obj = await env.UPLOADS.get(key, {
        range: { offset: range.start, length: range.length },
      });
      if (!obj) return null;
      return {
        body: obj.body,
        status: 206,
        headers: uploadResponseHeaders(contentType, size, {
          "Content-Length": String(range.length),
          "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
        }),
      };
    }

    const obj = await env.UPLOADS.get(key);
    if (!obj) return null;
    return {
      body: obj.body,
      status: 200,
      headers: uploadResponseHeaders(contentType, size, {
        "Content-Length": String(size),
      }),
    };
  }

  const root = getProjectRoot();
  if (!root) return null;

  try {
    const filePath = path.join(root, "public", "uploads", ...key.split("/"));
    const body = await readFile(filePath);
    const contentType = guessContentType(filePath);
    const size = body.byteLength;
    const range = parseRangeHeader(request?.headers?.get("Range"), size);

    if (range) {
      const slice = body.slice(range.start, range.end + 1);
      return {
        body: slice,
        status: 206,
        headers: uploadResponseHeaders(contentType, size, {
          "Content-Length": String(range.length),
          "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
        }),
      };
    }

    return {
      body,
      status: 200,
      headers: uploadResponseHeaders(contentType, size, {
        "Content-Length": String(size),
      }),
    };
  } catch {
    return null;
  }
}

/** @deprecated Use serveUploadedFile for Range support */
export async function getUploadedImage(keyPath, env) {
  const served = await serveUploadedFile(keyPath, env);
  if (!served) return null;
  const body =
    served.body instanceof ArrayBuffer
      ? served.body
      : served.body instanceof Uint8Array
        ? served.body.buffer.slice(served.body.byteOffset, served.body.byteOffset + served.body.byteLength)
        : await new Response(served.body).arrayBuffer();
  return { body, contentType: served.headers["Content-Type"] };
}
