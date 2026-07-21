import { query, isDatabaseConfigured } from "./pool.mjs";
import { DEFAULT_POSTS } from "../content-defaults.mjs";
import { resolvePostLocaleBlock } from "../i18n-locales.mjs";
import { resolvePostBlocks, bodyFromBlocks } from "../journal-blocks.mjs";

function parseLocales(row) {
  const raw = row.locales && typeof row.locales === "object" ? row.locales : {};
  if (Object.keys(raw).length > 0) return raw;
  return {
    en: {
      title: row.title,
      excerpt: row.excerpt || "",
      category: row.category || "",
      body: Array.isArray(row.body) ? row.body : [],
    },
  };
}

function parseImageFocal(value) {
  if (!value || typeof value !== "object") return undefined;
  const x = Number(value.x);
  const y = Number(value.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
  return { x, y };
}

function flattenPost(row, { locale, includeLocales = false } = {}) {
  const locales = parseLocales(row);
  const resolved = resolvePostLocaleBlock(locales, locale);
  const block = resolved?.block || {
    title: row.title,
    excerpt: row.excerpt || "",
    category: row.category || "",
    body: Array.isArray(row.body) ? row.body : [],
  };

  const blocks = resolvePostBlocks(block);
  const body = bodyFromBlocks(blocks);

  const post = {
    slug: row.slug,
    title: block.title || row.title,
    excerpt: block.excerpt || "",
    image: row.image,
    imageFocal: parseImageFocal(row.image_focal),
    category: block.category || "",
    readMinutes: row.read_minutes,
    body,
    blocks,
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (includeLocales) {
    post.locales = locales;
  }

  return post;
}

function defaultPostToLocales(post) {
  return {
    en: {
      title: post.title,
      excerpt: post.excerpt || "",
      category: post.category || "",
      body: Array.isArray(post.body) ? post.body : [],
    },
  };
}

function normalizePostInput(data) {
  const image = data.image || "";
  const readMinutes = Number(data.readMinutes) || 5;

  if (data.locales && typeof data.locales === "object") {
    return {
      slug: data.slug,
      status: data.status === "published" ? "published" : "draft",
      image,
      imageFocal: data.imageFocal,
      readMinutes,
      locales: data.locales,
    };
  }

  return {
    slug: data.slug,
    status: data.status === "published" ? "published" : "draft",
    image,
    imageFocal: data.imageFocal,
    readMinutes,
    locales: {
      en: {
        title: data.title || "",
        excerpt: data.excerpt || "",
        category: data.category || "",
        body: Array.isArray(data.body) ? data.body : [],
      },
    },
  };
}

export async function listPublishedPosts(locale) {
  if (!isDatabaseConfigured()) {
    return DEFAULT_POSTS.map((p) =>
      flattenPost(
        {
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          image: p.image,
          category: p.category,
          read_minutes: p.readMinutes,
          body: p.body,
          status: "published",
          locales: defaultPostToLocales(p),
          published_at: null,
          created_at: null,
          updated_at: null,
        },
        { locale },
      ),
    );
  }

  const { rows } = await query(
    `SELECT slug, title, excerpt, image, image_focal, category, read_minutes, body, locales, status, published_at, created_at, updated_at
     FROM posts WHERE status = 'published'
     ORDER BY published_at DESC NULLS LAST, created_at DESC`,
  );

  if (rows.length === 0) {
    return DEFAULT_POSTS.map((p) =>
      flattenPost(
        {
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          image: p.image,
          category: p.category,
          read_minutes: p.readMinutes,
          body: p.body,
          status: "published",
          locales: defaultPostToLocales(p),
          published_at: null,
          created_at: null,
          updated_at: null,
        },
        { locale },
      ),
    );
  }

  return rows.map((row) => flattenPost(row, { locale }));
}

export async function getPostBySlug(slug, { includeDraft = false, locale, includeLocales = false } = {}) {
  if (!isDatabaseConfigured()) {
    const fallback = DEFAULT_POSTS.find((p) => p.slug === slug);
    if (!fallback) return null;
    return flattenPost(
      {
        slug: fallback.slug,
        title: fallback.title,
        excerpt: fallback.excerpt,
        image: fallback.image,
        category: fallback.category,
        read_minutes: fallback.readMinutes,
        body: fallback.body,
        status: "published",
        locales: defaultPostToLocales(fallback),
        published_at: null,
        created_at: null,
        updated_at: null,
      },
      { locale, includeLocales },
    );
  }

  const statusFilter = includeDraft ? "" : "AND status = 'published'";
  const { rows } = await query(
    `SELECT slug, title, excerpt, image, image_focal, category, read_minutes, body, locales, status, published_at, created_at, updated_at
     FROM posts WHERE slug = $1 ${statusFilter}`,
    [slug],
  );

  if (rows.length === 0) {
    const fallback = DEFAULT_POSTS.find((p) => p.slug === slug);
    if (!fallback) return null;
    return flattenPost(
      {
        slug: fallback.slug,
        title: fallback.title,
        excerpt: fallback.excerpt,
        image: fallback.image,
        category: fallback.category,
        read_minutes: fallback.readMinutes,
        body: fallback.body,
        status: "published",
        locales: defaultPostToLocales(fallback),
        published_at: null,
        created_at: null,
        updated_at: null,
      },
      { locale, includeLocales },
    );
  }

  return flattenPost(rows[0], { locale, includeLocales });
}

export async function listAllPosts() {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for blog admin");
    err.status = 503;
    throw err;
  }
  const { rows } = await query(
    `SELECT slug, title, excerpt, image, image_focal, category, read_minutes, body, locales, status, published_at, created_at, updated_at
     FROM posts ORDER BY updated_at DESC`,
  );
  return rows.map((row) => flattenPost(row, { includeLocales: true }));
}

export async function upsertPost(data) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for blog admin");
    err.status = 503;
    throw err;
  }

  const normalized = normalizePostInput(data);
  const primary =
    resolvePostLocaleBlock(normalized.locales, "en")?.block ||
    resolvePostLocaleBlock(normalized.locales, "fr")?.block ||
    Object.values(normalized.locales).find((b) => b?.title);

  if (!primary?.title) {
    const err = new Error("At least one locale must have a title");
    err.status = 400;
    throw err;
  }

  const body = Array.isArray(primary.body) ? primary.body : bodyFromBlocks(resolvePostBlocks(primary));
  const status = normalized.status;
  const publishedAt = status === "published" ? data.publishedAt || new Date().toISOString() : null;

  const { rows } = await query(
    `INSERT INTO posts (slug, title, excerpt, image, image_focal, category, read_minutes, body, locales, status, published_at, updated_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8::jsonb, $9::jsonb, $10, $11, now())
     ON CONFLICT (slug) DO UPDATE SET
       title = EXCLUDED.title,
       excerpt = EXCLUDED.excerpt,
       image = EXCLUDED.image,
       image_focal = EXCLUDED.image_focal,
       category = EXCLUDED.category,
       read_minutes = EXCLUDED.read_minutes,
       body = EXCLUDED.body,
       locales = EXCLUDED.locales,
       status = EXCLUDED.status,
       published_at = CASE WHEN EXCLUDED.status = 'published' THEN COALESCE(posts.published_at, EXCLUDED.published_at, now()) ELSE NULL END,
       updated_at = now()
     RETURNING slug, title, excerpt, image, image_focal, category, read_minutes, body, locales, status, published_at, created_at, updated_at`,
    [
      normalized.slug,
      primary.title,
      primary.excerpt || "",
      normalized.image || "",
      normalized.imageFocal ? JSON.stringify(normalized.imageFocal) : null,
      primary.category || "",
      normalized.readMinutes,
      JSON.stringify(body),
      JSON.stringify(normalized.locales),
      status,
      publishedAt,
    ],
  );
  return flattenPost(rows[0], { includeLocales: true });
}

export async function deletePost(slug) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for blog admin");
    err.status = 503;
    throw err;
  }
  const { rowCount } = await query(`DELETE FROM posts WHERE slug = $1`, [slug]);
  if (!rowCount) {
    const err = new Error("Post not found");
    err.status = 404;
    throw err;
  }
  return { ok: true };
}

export async function seedPosts() {
  if (!isDatabaseConfigured()) return { seeded: 0 };
  let seeded = 0;
  for (const post of DEFAULT_POSTS) {
    const { rows } = await query(`SELECT 1 FROM posts WHERE slug = $1`, [post.slug]);
    if (rows.length > 0) continue;
    await upsertPost({
      ...post,
      status: "published",
      locales: defaultPostToLocales(post),
    });
    seeded++;
  }
  return { seeded };
}
