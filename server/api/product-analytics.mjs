import { recordProductEvent } from "../db/product-analytics.mjs";

export async function postProductAnalyticsEvent(request) {
  const body = await request.json().catch(() => ({}));
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim().toLowerCase() : "";
  if (!slug || !type) {
    const err = new Error("slug and type are required");
    err.status = 400;
    throw err;
  }
  return recordProductEvent(slug, type);
}

export async function getAdminProductAnalyticsResponse(request) {
  const url = new URL(request.url);
  const days = Number(url.searchParams.get("days")) || 30;
  const limit = Number(url.searchParams.get("limit")) || 50;
  const { getProductAnalyticsSummary } = await import("../db/product-analytics.mjs");
  const summary = await getProductAnalyticsSummary({ days, limit });
  return { analytics: summary, source: "postgres" };
}
