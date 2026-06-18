import { getAdminSiteContent, patchAdminSiteContent } from "../db/cms-site.mjs";
import { listAllPosts, upsertPost, deletePost, seedPosts } from "../db/posts.mjs";
import { listAllPages, upsertPage, deletePage, seedPages } from "../db/pages.mjs";
import { listCollectionsAdmin, updateCollection } from "../db/collections-admin.mjs";
import { setSetting } from "../db/settings-store.mjs";
import { DEFAULT_HOMEPAGE, DEFAULT_ANNOUNCEMENT } from "../content-defaults.mjs";

export async function getAdminContentResponse() {
  const data = await getAdminSiteContent();
  return { ...data, source: "postgres" };
}

export async function patchAdminContentResponse(body) {
  const data = await patchAdminSiteContent(body);
  return { ...data, source: "postgres" };
}

export async function getAdminPostsResponse() {
  const posts = await listAllPosts();
  return { posts, source: "postgres" };
}

export async function getAdminPostResponse(slug) {
  const { getPostBySlug } = await import("../db/posts.mjs");
  const post = await getPostBySlug(slug, { includeDraft: true });
  if (!post) {
    const err = new Error("Post not found");
    err.status = 404;
    throw err;
  }
  return { post, source: "postgres" };
}

export async function saveAdminPostResponse(body) {
  const post = await upsertPost(body);
  return { post, source: "postgres" };
}

export async function removeAdminPostResponse(slug) {
  const result = await deletePost(slug);
  return { ...result, source: "postgres" };
}

export async function getAdminPagesResponse() {
  const pages = await listAllPages();
  return { pages, source: "postgres" };
}

export async function getAdminPageResponse(slug) {
  const page = await (await import("../db/pages.mjs")).getPageBySlug(slug, { includeDraft: true });
  if (!page) {
    const err = new Error("Page not found");
    err.status = 404;
    throw err;
  }
  return { page, source: "postgres" };
}

export async function saveAdminPageResponse(body) {
  const page = await upsertPage(body);
  return { page, source: "postgres" };
}

export async function removeAdminPageResponse(slug) {
  const result = await deletePage(slug);
  return { ...result, source: "postgres" };
}

export async function getAdminCollectionsResponse() {
  const collections = await listCollectionsAdmin();
  return { collections, source: "postgres" };
}

export async function patchAdminCollectionResponse(slug, body) {
  const collection = await updateCollection(slug, body);
  return { collection, source: "postgres" };
}

export async function seedCmsContent() {
  const [posts, pages] = await Promise.all([seedPosts(), seedPages()]);
  const hasHomepage = await import("../db/settings-store.mjs").then((m) => m.getSetting("homepage", null));
  if (!hasHomepage) await setSetting("homepage", DEFAULT_HOMEPAGE);
  const hasAnnouncement = await import("../db/settings-store.mjs").then((m) => m.getSetting("announcement", null));
  if (!hasAnnouncement) await setSetting("announcement", DEFAULT_ANNOUNCEMENT);
  return { posts, pages, source: "postgres" };
}
