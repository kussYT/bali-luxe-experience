import path from "node:path";
import { fileURLToPath } from "node:url";

let cachedRoot;

/**
 * Project root on Node (Vite dev / scripts). Null on Cloudflare Workers where
 * bundled modules may not have import.meta.url — never call fileURLToPath at import time.
 */
export function getProjectRoot() {
  if (cachedRoot !== undefined) return cachedRoot;
  try {
    const metaUrl = import.meta.url;
    if (typeof metaUrl !== "string" || !metaUrl) {
      cachedRoot = null;
    } else {
      cachedRoot = path.resolve(path.dirname(fileURLToPath(metaUrl)), "..");
    }
  } catch {
    cachedRoot = null;
  }
  return cachedRoot;
}

export function requireProjectRoot() {
  const root = getProjectRoot();
  if (!root) {
    const err = new Error("Filesystem storage is not available in this runtime");
    err.status = 503;
    throw err;
  }
  return root;
}
