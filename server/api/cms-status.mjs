import { isDatabaseConfigured } from "../db/pool.mjs";
import { listAllPosts } from "../db/posts.mjs";
import { listAllPages } from "../db/pages.mjs";
import { listCollectionsAdmin } from "../db/collections-admin.mjs";
import { getSetting } from "../db/settings-store.mjs";
import { getStaticInstagramFeed } from "../instagram-static.mjs";
import { summarizeInstagramFeed } from "../instagram-utils.mjs";

export async function getAdminCmsStatusResponse() {
  const instagram = summarizeInstagramFeed(getStaticInstagramFeed());
  const instagramApi = {
    hasToken: Boolean(process.env.INSTAGRAM_ACCESS_TOKEN?.trim()),
    hasUserId: Boolean(process.env.INSTAGRAM_USER_ID?.trim()),
  };

  if (!isDatabaseConfigured()) {
    return {
      source: "fallback",
      database: false,
      instagram,
      instagramApi,
      cms: null,
    };
  }

  const [posts, pages, collections, homepage, announcement] = await Promise.all([
    listAllPosts(),
    listAllPages(),
    listCollectionsAdmin(),
    getSetting("homepage", null),
    getSetting("announcement", null),
  ]);

  return {
    source: "postgres",
    database: true,
    instagram,
    instagramApi,
    cms: {
      posts: posts.length,
      pages: pages.length,
      collections: collections.length,
      hasHomepage: Boolean(homepage),
      hasAnnouncement: Boolean(announcement),
    },
  };
}
