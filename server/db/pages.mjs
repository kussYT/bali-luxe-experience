import { query, isDatabaseConfigured } from "./pool.mjs";
import { DEFAULT_PAGES } from "../content-defaults.mjs";

function mapPage(row) {
  const body = Array.isArray(row.body) ? row.body : [];
  return {
    slug: row.slug,
    title: row.title,
    eyebrow: row.eyebrow,
    metaDescription: row.meta_description,
    body,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getPageBySlug(slug, { includeDraft = false } = {}) {
  if (!isDatabaseConfigured()) {
    const fallback = DEFAULT_PAGES.find((p) => p.slug === slug);
    return fallback ? { ...fallback, status: "published" } : null;
  }
  const statusFilter = includeDraft ? "" : "AND status = 'published'";
  const { rows } = await query(
    `SELECT slug, title, eyebrow, meta_description, body, status, created_at, updated_at
     FROM pages WHERE slug = $1 ${statusFilter}`,
    [slug],
  );
  if (rows.length === 0) {
    const fallback = DEFAULT_PAGES.find((p) => p.slug === slug);
    return fallback ? { ...fallback, status: "published" } : null;
  }
  return mapPage(rows[0]);
}

export async function listAllPages() {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for pages admin");
    err.status = 503;
    throw err;
  }
  const { rows } = await query(
    `SELECT slug, title, eyebrow, meta_description, body, status, created_at, updated_at
     FROM pages ORDER BY slug ASC`,
  );
  return rows.map(mapPage);
}

export async function upsertPage(data) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for pages admin");
    err.status = 503;
    throw err;
  }
  const body = Array.isArray(data.body) ? data.body : [];
  const status = data.status === "published" ? "published" : "draft";

  const { rows } = await query(
    `INSERT INTO pages (slug, title, eyebrow, meta_description, body, status, updated_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6, now())
     ON CONFLICT (slug) DO UPDATE SET
       title = EXCLUDED.title,
       eyebrow = EXCLUDED.eyebrow,
       meta_description = EXCLUDED.meta_description,
       body = EXCLUDED.body,
       status = EXCLUDED.status,
       updated_at = now()
     RETURNING slug, title, eyebrow, meta_description, body, status, created_at, updated_at`,
    [
      data.slug,
      data.title,
      data.eyebrow || "",
      data.metaDescription || "",
      JSON.stringify(body),
      status,
    ],
  );
  return mapPage(rows[0]);
}

export async function deletePage(slug) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for pages admin");
    err.status = 503;
    throw err;
  }
  const { rowCount } = await query(`DELETE FROM pages WHERE slug = $1`, [slug]);
  if (!rowCount) {
    const err = new Error("Page not found");
    err.status = 404;
    throw err;
  }
  return { ok: true };
}

export async function seedPages() {
  if (!isDatabaseConfigured()) return { seeded: 0 };
  let seeded = 0;
  for (const page of DEFAULT_PAGES) {
    const { rows } = await query(`SELECT 1 FROM pages WHERE slug = $1`, [page.slug]);
    if (rows.length > 0) continue;
    await upsertPage({ ...page, status: "published" });
    seeded++;
  }
  return { seeded };
}
