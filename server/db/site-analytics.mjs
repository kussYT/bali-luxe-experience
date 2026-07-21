import { query, isDatabaseConfigured } from "./pool.mjs";

const MAX_PATH = 300;
const MAX_REFERRER = 500;
const MAX_VISITOR = 64;
const VALID_DEVICES = new Set(["mobile", "tablet", "desktop", "unknown"]);

export function classifyTrafficSource(referrer, utmSource) {
  const utm = String(utmSource || "")
    .trim()
    .toLowerCase();
  if (utm) {
    if (utm.includes("instagram") || utm === "ig") return "instagram";
    if (utm.includes("facebook") || utm === "fb" || utm === "meta") return "facebook";
    if (utm.includes("google")) return "google";
    if (utm.includes("pinterest")) return "pinterest";
    if (utm.includes("tiktok")) return "tiktok";
    if (utm.includes("twitter") || utm === "x") return "twitter";
    if (utm.includes("bing")) return "bing";
    return utm.slice(0, 40);
  }

  const ref = String(referrer || "").trim();
  if (!ref) return "direct";

  let host = "";
  try {
    host = new URL(ref).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "other";
  }

  if (!host || host.includes("bingindiaries") || host.includes("localhost") || host.includes("workers.dev")) {
    return "direct";
  }
  if (host.includes("instagram") || host === "l.instagram.com") return "instagram";
  if (host.includes("facebook") || host.includes("fb.com") || host.includes("meta.com")) return "facebook";
  if (host.includes("google.")) return "google";
  if (host.includes("pinterest") || host.includes("pin.it")) return "pinterest";
  if (host.includes("tiktok")) return "tiktok";
  if (host.includes("twitter") || host === "x.com" || host.endsWith(".x.com")) return "twitter";
  if (host.includes("bing.")) return "bing";
  return host.slice(0, 60);
}

export function classifyDevice(userAgent) {
  const ua = String(userAgent || "").toLowerCase();
  if (!ua) return "unknown";
  if (/ipad|tablet|kindle|silk|(android(?!.*mobile))/.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android.*mobile|windows phone/.test(ua)) return "mobile";
  if (/bot|crawl|spider|slurp|headless|preview|facebookexternalhit|whatsapp|telegram/.test(ua)) {
    return "bot";
  }
  return "desktop";
}

export async function recordSitePageview({
  visitorId,
  path,
  referrer,
  source,
  device,
}) {
  if (!isDatabaseConfigured()) return { ok: false, reason: "no_db" };

  const vid = String(visitorId || "")
    .trim()
    .slice(0, MAX_VISITOR);
  const p = String(path || "/")
    .trim()
    .slice(0, MAX_PATH);
  if (!vid || !p || p.startsWith("/admin") || p.startsWith("/api")) {
    const err = new Error("Invalid pageview");
    err.status = 400;
    throw err;
  }

  const deviceNorm = VALID_DEVICES.has(device) ? device : "unknown";
  const sourceNorm = String(source || "direct")
    .trim()
    .toLowerCase()
    .slice(0, 60) || "direct";
  const ref = referrer ? String(referrer).trim().slice(0, MAX_REFERRER) : null;

  await query(
    `INSERT INTO site_pageviews (visitor_id, path, referrer, source, device)
     VALUES ($1, $2, $3, $4, $5)`,
    [vid, p, ref, sourceNorm, deviceNorm],
  );
  return { ok: true };
}

export async function getSiteTrafficSummary({ days = 30 } = {}) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for site analytics");
    err.status = 503;
    throw err;
  }

  const windowDays = Math.min(90, Math.max(1, Number(days) || 30));

  const [summaryRes, dailyRes, pagesRes, sourcesRes, devicesRes, realtimeRes] = await Promise.all([
    query(
      `SELECT
         COUNT(*)::int AS pageviews,
         COUNT(DISTINCT visitor_id)::int AS visitors
       FROM site_pageviews
       WHERE created_at >= now() - ($1::text || ' days')::interval
         AND device <> 'bot'`,
      [String(windowDays)],
    ),
    query(
      `SELECT
         to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
         COUNT(*)::int AS pageviews,
         COUNT(DISTINCT visitor_id)::int AS visitors
       FROM site_pageviews
       WHERE created_at >= now() - ($1::text || ' days')::interval
         AND device <> 'bot'
       GROUP BY 1
       ORDER BY 1 ASC`,
      [String(windowDays)],
    ),
    query(
      `SELECT
         path,
         COUNT(*)::int AS pageviews,
         COUNT(DISTINCT visitor_id)::int AS visitors
       FROM site_pageviews
       WHERE created_at >= now() - ($1::text || ' days')::interval
         AND device <> 'bot'
       GROUP BY path
       ORDER BY pageviews DESC
       LIMIT 30`,
      [String(windowDays)],
    ),
    query(
      `SELECT
         source,
         COUNT(*)::int AS pageviews,
         COUNT(DISTINCT visitor_id)::int AS visitors
       FROM site_pageviews
       WHERE created_at >= now() - ($1::text || ' days')::interval
         AND device <> 'bot'
       GROUP BY source
       ORDER BY pageviews DESC
       LIMIT 20`,
      [String(windowDays)],
    ),
    query(
      `SELECT
         device,
         COUNT(*)::int AS pageviews,
         COUNT(DISTINCT visitor_id)::int AS visitors
       FROM site_pageviews
       WHERE created_at >= now() - ($1::text || ' days')::interval
         AND device <> 'bot'
       GROUP BY device
       ORDER BY pageviews DESC`,
      [String(windowDays)],
    ),
    query(
      `SELECT
         COUNT(*)::int AS pageviews,
         COUNT(DISTINCT visitor_id)::int AS visitors
       FROM site_pageviews
       WHERE created_at >= now() - interval '30 minutes'
         AND device <> 'bot'`,
    ),
  ]);

  const summary = summaryRes.rows[0] || {};
  const realtime = realtimeRes.rows[0] || {};

  return {
    days: windowDays,
    summary: {
      pageviews: summary.pageviews ?? 0,
      visitors: summary.visitors ?? 0,
    },
    realtime: {
      pageviews: realtime.pageviews ?? 0,
      visitors: realtime.visitors ?? 0,
    },
    byDay: dailyRes.rows.map((r) => ({
      day: r.day,
      pageviews: r.pageviews ?? 0,
      visitors: r.visitors ?? 0,
    })),
    topPages: pagesRes.rows.map((r) => ({
      path: r.path,
      pageviews: r.pageviews ?? 0,
      visitors: r.visitors ?? 0,
    })),
    bySource: sourcesRes.rows.map((r) => ({
      source: r.source,
      pageviews: r.pageviews ?? 0,
      visitors: r.visitors ?? 0,
    })),
    byDevice: devicesRes.rows.map((r) => ({
      device: r.device,
      pageviews: r.pageviews ?? 0,
      visitors: r.visitors ?? 0,
    })),
  };
}
