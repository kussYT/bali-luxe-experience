import {
  recordSitePageview,
  getSiteTrafficSummary,
  classifyTrafficSource,
  classifyDevice,
} from "../db/site-analytics.mjs";

export async function postSitePageview(request) {
  const body = await request.json().catch(() => ({}));
  const visitorId = typeof body.visitorId === "string" ? body.visitorId.trim() : "";
  const path = typeof body.path === "string" ? body.path.trim() : "";
  const referrer = typeof body.referrer === "string" ? body.referrer.trim() : "";
  const utmSource = typeof body.utmSource === "string" ? body.utmSource.trim() : "";

  const ua = request.headers.get("user-agent") || "";
  const device = classifyDevice(ua);
  if (device === "bot") {
    return { ok: true, skipped: "bot" };
  }

  const source = classifyTrafficSource(referrer, utmSource);

  return recordSitePageview({
    visitorId,
    path,
    referrer: referrer || null,
    source,
    device,
  });
}

export async function getAdminSiteTrafficResponse(request) {
  const url = new URL(request.url);
  const days = Number(url.searchParams.get("days")) || 30;
  const analytics = await getSiteTrafficSummary({ days });
  return { analytics, source: "postgres" };
}
