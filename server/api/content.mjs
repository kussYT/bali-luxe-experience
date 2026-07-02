import { getPublicSiteContent } from "../db/cms-site.mjs";
import { listPublishedPosts, getPostBySlug } from "../db/posts.mjs";
import { getPageBySlug } from "../db/pages.mjs";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, s-maxage=300",
};

export async function getSiteContentResponse() {
  const content = await getPublicSiteContent();
  return Response.json(content, { headers: CACHE_HEADERS });
}

export async function getPostsListResponse(locale) {
  const posts = await listPublishedPosts(locale);
  return Response.json({ posts }, { headers: CACHE_HEADERS });
}

export async function getPostResponse(slug, locale) {
  const post = await getPostBySlug(slug, { locale });
  if (!post) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ post }, { headers: CACHE_HEADERS });
}

export async function getPageResponse(slug, locale) {
  const page = await getPageBySlug(slug, { locale });
  if (!page) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ page }, { headers: CACHE_HEADERS });
}
