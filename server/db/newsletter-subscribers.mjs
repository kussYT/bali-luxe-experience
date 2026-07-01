import { query, isDatabaseConfigured } from "./pool.mjs";

export async function appendNewsletterSubscriber({ email, source }) {
  if (!isDatabaseConfigured()) return false;
  const normalized = email.trim().toLowerCase();
  await query(
    `INSERT INTO newsletter_subscribers (email, source, subscribed_at)
     VALUES ($1, $2, now())
     ON CONFLICT (email) DO UPDATE SET
       source = EXCLUDED.source,
       subscribed_at = newsletter_subscribers.subscribed_at`,
    [normalized, source || "website"],
  );
  return true;
}

export async function hasNewsletterSubscriber(email) {
  if (!isDatabaseConfigured()) return false;
  const normalized = email.trim().toLowerCase();
  const { rows } = await query(`SELECT 1 FROM newsletter_subscribers WHERE email = $1`, [normalized]);
  return rows.length > 0;
}

export async function listNewsletterSubscribers({ limit = 500 } = {}) {
  if (!isDatabaseConfigured()) return [];
  const { rows } = await query(
    `SELECT email, source, subscribed_at
     FROM newsletter_subscribers
     ORDER BY subscribed_at DESC
     LIMIT $1`,
    [limit],
  );
  return rows.map((row) => ({
    email: row.email,
    source: row.source || "website",
    subscribedAt: row.subscribed_at ? new Date(row.subscribed_at).toISOString() : null,
  }));
}

export async function countNewsletterSubscribers() {
  if (!isDatabaseConfigured()) return 0;
  const { rows } = await query(`SELECT COUNT(*)::int AS n FROM newsletter_subscribers`);
  return rows[0]?.n ?? 0;
}
