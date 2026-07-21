/** Canonical customer-facing origin (not workers.dev). */
export const PRODUCTION_SITE_ORIGIN = "https://bingindiaries.com";

/**
 * Public storefront URL for admin "View site" links.
 * Keeps localhost for local/dev; always uses the real domain in production hosts.
 */
export function publicSiteUrl(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (typeof window === "undefined") {
    return `${PRODUCTION_SITE_ORIGIN}${normalized}`;
  }
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return `${window.location.origin}${normalized}`;
  }
  return `${PRODUCTION_SITE_ORIGIN}${normalized}`;
}
