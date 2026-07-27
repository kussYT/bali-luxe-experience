/**
 * Instagram feed — @bingindiaries
 * https://www.instagram.com/bingindiaries/
 *
 * Graph API: https://developers.facebook.com/docs/instagram-api
 */

export const INSTAGRAM_PROFILE = {
  handle: "@bingindiaries",
  profileUrl: "https://www.instagram.com/bingindiaries/",
  title: "Follow the diary",
  subtitle: "Seen in the sun",
};

const GRAPH_VERSION = "v21.0";

function mapGraphMedia(item) {
  const type = item.media_type;
  let image = null;

  if (type === "VIDEO") {
    image = item.thumbnail_url || item.media_url || null;
  } else if (type === "CAROUSEL_ALBUM") {
    const children = item.children?.data || [];
    const firstImage = children.find((c) => c.media_type === "IMAGE" && c.media_url);
    const firstVideo = children.find((c) => c.media_type === "VIDEO" && (c.thumbnail_url || c.media_url));
    const firstAny = children.find((c) => c.media_url || c.thumbnail_url);
    image =
      firstImage?.media_url ||
      firstVideo?.thumbnail_url ||
      firstVideo?.media_url ||
      firstAny?.thumbnail_url ||
      firstAny?.media_url ||
      item.media_url ||
      item.thumbnail_url ||
      null;
  } else {
    // IMAGE and any newer types Meta may send
    image = item.media_url || item.thumbnail_url || null;
  }

  if (!image) return null;
  const caption = typeof item.caption === "string" ? item.caption : "";
  const alt = caption.slice(0, 120) || "Bingin Diaries on Instagram";
  return {
    id: String(item.id),
    image,
    alt,
    caption: caption || undefined,
    permalink: item.permalink || INSTAGRAM_PROFILE.profileUrl,
  };
}

async function hydrateCarouselChildren(item, token) {
  if (item.media_type !== "CAROUSEL_ALBUM") return item;
  if (item.children?.data?.length) return item;
  try {
    const url = `https://graph.instagram.com/${item.id}?fields=children{media_url,media_type,thumbnail_url}&access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url);
    if (!res.ok) return item;
    const data = await res.json();
    return { ...item, children: data.children };
  } catch {
    return item;
  }
}

/** Instagram Graph API — requires INSTAGRAM_ACCESS_TOKEN */
export async function fetchInstagramFromGraph() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  const userId = process.env.INSTAGRAM_USER_ID?.trim();
  if (!token) return null;

  // Pull extra items so one unusable video/carousel doesn't leave the homepage grid at 5.
  const fields =
    "id,media_type,media_url,permalink,caption,thumbnail_url,children{media_url,media_type,thumbnail_url}";
  const accountPath = userId ? `${userId}/media` : "me/media";
  const url = `https://graph.instagram.com/${accountPath}?fields=${fields}&limit=18&access_token=${encodeURIComponent(token)}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Instagram Graph API ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data.data || [];
  const hydrated = [];
  for (const item of raw) {
    hydrated.push(await hydrateCarouselChildren(item, token));
  }

  const posts = hydrated.map(mapGraphMedia).filter(Boolean).slice(0, 6);
  if (posts.length === 0) return null;

  return {
    profile: INSTAGRAM_PROFILE,
    posts,
    syncedAt: new Date().toISOString(),
    source: "graph-api",
    meta: {
      rawCount: raw.length,
      mappedCount: hydrated.map(mapGraphMedia).filter(Boolean).length,
    },
  };
}

/** oEmbed pour une liste d’URLs de posts publics (sans User ID) */
export async function fetchInstagramFromOEmbed(postUrls) {
  const posts = [];
  for (const postUrl of postUrls) {
    const trimmed = postUrl.trim();
    if (!trimmed) continue;
    try {
      const oembedUrl = `https://graph.facebook.com/${GRAPH_VERSION}/instagram_oembed?url=${encodeURIComponent(trimmed)}&access_token=${encodeURIComponent(process.env.INSTAGRAM_ACCESS_TOKEN || "")}&omitscript=true`;
      let res = await fetch(oembedUrl);
      if (!res.ok && !process.env.INSTAGRAM_ACCESS_TOKEN) {
        res = await fetch(
          `https://api.instagram.com/oembed?url=${encodeURIComponent(trimmed)}&omitscript=true`,
        );
      }
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.thumbnail_url) continue;
      posts.push({
        id: trimmed,
        image: data.thumbnail_url,
        alt: data.title || "Bingin Diaries on Instagram",
        permalink: trimmed,
      });
    } catch {
      /* skip failed post */
    }
  }
  if (posts.length === 0) return null;
  return {
    profile: INSTAGRAM_PROFILE,
    posts: posts.slice(0, 6),
    syncedAt: new Date().toISOString(),
    source: "oembed",
  };
}

export async function fetchInstagramFeed() {
  try {
    const graph = await fetchInstagramFromGraph();
    if (graph) return graph;
  } catch (e) {
    console.warn("[instagram]", e.message);
  }

  const urls = process.env.INSTAGRAM_POST_URLS?.split(",").filter(Boolean);
  if (urls?.length) {
    try {
      const oembed = await fetchInstagramFromOEmbed(urls);
      if (oembed) return oembed;
    } catch (e) {
      console.warn("[instagram oembed]", e.message);
    }
  }

  return null;
}
