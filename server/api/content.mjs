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

export async function getPostsListResponse() {
  const posts = await listPublishedPosts();
  return Response.json({ posts }, { headers: CACHE_HEADERS });
}

export async function getPostResponse(slug) {
  const post = await getPostBySlug(slug);
  if (!post) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ post }, { headers: CACHE_HEADERS });
}

export async function getPageResponse(slug) {
  const page = await getPageBySlug(slug);
  if (!page) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ page }, { headers: CACHE_HEADERS });
}
