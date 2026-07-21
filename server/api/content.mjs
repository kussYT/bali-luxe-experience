import { getPublicSiteContent } from "../db/cms-site.mjs";
import { listPublishedPosts, getPostBySlug } from "../db/posts.mjs";
import { getPageBySlug } from "../db/pages.mjs";
import { getCached } from "../db/request-cache.mjs";
import { logQueryStats, resetQueryStats } from "../db/query-stats.mjs";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, s-maxage=300",
};

const SITE_CONTENT_TTL_MS = 60_000;

export async function getSiteContentResponse(locale) {
  resetQueryStats();
  const content = await getCached(`site-content:${locale || "default"}`, SITE_CONTENT_TTL_MS, () =>
    getPublicSiteContent({ locale }),
  );
  logQueryStats(`GET /api/content/site locale=${locale || "default"}`);
  return Response.json(content, { headers: CACHE_HEADERS });
}

export async function getPostsListResponse(locale) {
  resetQueryStats();
  const posts = await getCached(`posts-list:${locale || "default"}`, SITE_CONTENT_TTL_MS, () =>
    listPublishedPosts(locale),
  );
  logQueryStats(`GET /api/content/posts locale=${locale || "default"}`);
  return Response.json({ posts }, { headers: CACHE_HEADERS });
}

export async function getPostResponse(slug, locale) {
  resetQueryStats();
  const post = await getPostBySlug(slug, { locale });
  logQueryStats(`GET /api/content/posts/${slug}`);
  if (!post) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ post }, { headers: CACHE_HEADERS });
}

export async function getPageResponse(slug, locale) {
  resetQueryStats();
  const page = await getPageBySlug(slug, { locale });
  logQueryStats(`GET /api/content/pages/${slug}`);
  if (!page) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ page }, { headers: CACHE_HEADERS });
}
