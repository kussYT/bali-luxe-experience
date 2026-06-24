import { query, isDatabaseConfigured } from "./pool.mjs";
import { DEFAULT_PAGES } from "../content-defaults.mjs";
import { resolvePageLocaleBlock } from "../i18n-locales.mjs";

function parseLocales(row) {
  const raw = row.locales && typeof row.locales === "object" ? row.locales : {};
  if (Object.keys(raw).length > 0) return raw;
  return {
    en: {
      title: row.title,
      eyebrow: row.eyebrow,
      metaDescription: row.meta_description,
      body: Array.isArray(row.body) ? row.body : [],
    },
  };
}

function flattenPage(row, { locale, includeLocales = false } = {}) {
  const locales = parseLocales(row);
  const resolved = resolvePageLocaleBlock(locales, locale);
  const block = resolved?.block || {
    title: row.title,
    eyebrow: row.eyebrow,
    metaDescription: row.meta_description,
    body: Array.isArray(row.body) ? row.body : [],
  };

  const page = {
    slug: row.slug,
    title: block.title || row.title,
    eyebrow: block.eyebrow || "",
    metaDescription: block.metaDescription || "",
    body: Array.isArray(block.body) ? block.body : [],
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (includeLocales) {
    page.locales = locales;
  }

  return page;
}

function normalizePageInput(data) {
  if (data.locales && typeof data.locales === "object") {
    return {
      slug: data.slug,
      status: data.status === "published" ? "published" : "draft",
      locales: data.locales,
    };
  }
  return {
    slug: data.slug,
    status: data.status === "published" ? "published" : "draft",
    locales: {
      en: {
        title: data.title || "",
        eyebrow: data.eyebrow || "",
        metaDescription: data.metaDescription || "",
        body: Array.isArray(data.body) ? data.body : [],
      },
    },
  };
}

function defaultPageToLocales(page) {
  return {
    en: {
      title: page.title,
      eyebrow: page.eyebrow || "",
      metaDescription: page.metaDescription || "",
      body: Array.isArray(page.body) ? page.body : [],
    },
  };
}

export async function getPageBySlug(slug, { includeDraft = false, locale, includeLocales = false } = {}) {
  if (!isDatabaseConfigured()) {
    const fallback = DEFAULT_PAGES.find((p) => p.slug === slug);
    if (!fallback) return null;
    const locales = defaultPageToLocales(fallback);
    const row = { slug, status: "published", ...fallback, locales };
    return flattenPage(
      {
        slug,
        title: fallback.title,
        eyebrow: fallback.eyebrow,
        meta_description: fallback.metaDescription,
        body: fallback.body,
        status: "published",
        locales,
        created_at: null,
        updated_at: null,
      },
      { locale, includeLocales },
    );
  }

  const statusFilter = includeDraft ? "" : "AND status = 'published'";
  const { rows } = await query(
    `SELECT slug, title, eyebrow, meta_description, body, locales, status, created_at, updated_at
     FROM pages WHERE slug = $1 ${statusFilter}`,
    [slug],
  );

  if (rows.length === 0) {
    const fallback = DEFAULT_PAGES.find((p) => p.slug === slug);
    if (!fallback) return null;
    const locales = defaultPageToLocales(fallback);
    return flattenPage(
      {
        slug,
        title: fallback.title,
        eyebrow: fallback.eyebrow,
        meta_description: fallback.metaDescription,
        body: fallback.body,
        status: "published",
        locales,
        created_at: null,
        updated_at: null,
      },
      { locale, includeLocales },
    );
  }

  return flattenPage(rows[0], { locale, includeLocales });
}

export async function listAllPages() {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for pages admin");
    err.status = 503;
    throw err;
  }
  const { rows } = await query(
    `SELECT slug, title, eyebrow, meta_description, body, locales, status, created_at, updated_at
     FROM pages ORDER BY slug ASC`,
  );
  return rows.map((row) => flattenPage(row, { includeLocales: true }));
}

export async function upsertPage(data) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for pages admin");
    err.status = 503;
    throw err;
  }

  const normalized = normalizePageInput(data);
  const primary =
    resolvePageLocaleBlock(normalized.locales, "en")?.block ||
    resolvePageLocaleBlock(normalized.locales, "fr")?.block ||
    Object.values(normalized.locales).find((b) => b?.title);

  if (!primary?.title) {
    const err = new Error("At least one locale must have a title");
    err.status = 400;
    throw err;
  }

  const body = Array.isArray(primary.body) ? primary.body : [];

  const { rows } = await query(
    `INSERT INTO pages (slug, title, eyebrow, meta_description, body, locales, status, updated_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, now())
     ON CONFLICT (slug) DO UPDATE SET
       title = EXCLUDED.title,
       eyebrow = EXCLUDED.eyebrow,
       meta_description = EXCLUDED.meta_description,
       body = EXCLUDED.body,
       locales = EXCLUDED.locales,
       status = EXCLUDED.status,
       updated_at = now()
     RETURNING slug, title, eyebrow, meta_description, body, locales, status, created_at, updated_at`,
    [
      normalized.slug,
      primary.title,
      primary.eyebrow || "",
      primary.metaDescription || "",
      JSON.stringify(body),
      JSON.stringify(normalized.locales),
      normalized.status,
    ],
  );
  return flattenPage(rows[0], { includeLocales: true });
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
    await upsertPage({
      ...page,
      status: "published",
      locales: defaultPageToLocales(page),
    });
    seeded++;
  }
  return { seeded };
}
