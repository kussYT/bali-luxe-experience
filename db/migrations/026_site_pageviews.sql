-- Site-wide pageview analytics (server-side; works in Instagram in-app browser)
CREATE TABLE IF NOT EXISTS site_pageviews (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  path TEXT NOT NULL,
  referrer TEXT,
  source TEXT NOT NULL DEFAULT 'direct',
  device TEXT NOT NULL DEFAULT 'unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_pageviews_created
  ON site_pageviews (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_site_pageviews_path_created
  ON site_pageviews (path, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_site_pageviews_source_created
  ON site_pageviews (source, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_site_pageviews_visitor_created
  ON site_pageviews (visitor_id, created_at DESC);
