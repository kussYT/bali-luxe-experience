import { query, isDatabaseConfigured } from "./pool.mjs";
import { DEFAULT_POSTS } from "../content-defaults.mjs";

function mapPost(row) {
  const body = Array.isArray(row.body) ? row.body : [];
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    image: row.image,
    category: row.category,
    readMinutes: row.read_minutes,
    body,
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPublishedPosts() {
  if (!isDatabaseConfigured()) return DEFAULT_POSTS.map((p) => ({ ...p, status: "published" }));
  const { rows } = await query(
    `SELECT slug, title, excerpt, image, category, read_minutes, body, status, published_at, created_at, updated_at
     FROM posts WHERE status = 'published'
     ORDER BY published_at DESC NULLS LAST, created_at DESC`,
  );
  if (rows.length === 0) return DEFAULT_POSTS.map((p) => ({ ...p, status: "published" }));
  return rows.map(mapPost);
}

export async function getPostBySlug(slug, { includeDraft = false } = {}) {
  if (!isDatabaseConfigured()) {
    const fallback = DEFAULT_POSTS.find((p) => p.slug === slug);
    return fallback ? { ...fallback, status: "published" } : null;
  }
  const statusFilter = includeDraft ? "" : "AND status = 'published'";
  const { rows } = await query(
    `SELECT slug, title, excerpt, image, category, read_minutes, body, status, published_at, created_at, updated_at
     FROM posts WHERE slug = $1 ${statusFilter}`,
    [slug],
  );
  if (rows.length === 0) {
    const fallback = DEFAULT_POSTS.find((p) => p.slug === slug);
    return fallback ? { ...fallback, status: "published" } : null;
  }
  return mapPost(rows[0]);
}

export async function listAllPosts() {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for blog admin");
    err.status = 503;
    throw err;
  }
  const { rows } = await query(
    `SELECT slug, title, excerpt, image, category, read_minutes, body, status, published_at, created_at, updated_at
     FROM posts ORDER BY updated_at DESC`,
  );
  return rows.map(mapPost);
}

export async function upsertPost(data) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for blog admin");
    err.status = 503;
    throw err;
  }
  const body = Array.isArray(data.body) ? data.body : [];
  const status = data.status === "published" ? "published" : "draft";
  const publishedAt = status === "published" ? data.publishedAt || new Date().toISOString() : null;

  const { rows } = await query(
    `INSERT INTO posts (slug, title, excerpt, image, category, read_minutes, body, status, published_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, now())
     ON CONFLICT (slug) DO UPDATE SET
       title = EXCLUDED.title,
       excerpt = EXCLUDED.excerpt,
       image = EXCLUDED.image,
       category = EXCLUDED.category,
       read_minutes = EXCLUDED.read_minutes,
       body = EXCLUDED.body,
       status = EXCLUDED.status,
       published_at = CASE WHEN EXCLUDED.status = 'published' THEN COALESCE(posts.published_at, EXCLUDED.published_at, now()) ELSE NULL END,
       updated_at = now()
     RETURNING slug, title, excerpt, image, category, read_minutes, body, status, published_at, created_at, updated_at`,
    [
      data.slug,
      data.title,
      data.excerpt || "",
      data.image || "",
      data.category || "",
      Number(data.readMinutes) || 5,
      JSON.stringify(body),
      status,
      publishedAt,
    ],
  );
  return mapPost(rows[0]);
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
    await upsertPost({ ...post, status: "published" });
    seeded++;
  }
  return { seeded };
}
