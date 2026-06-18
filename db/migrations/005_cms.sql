-- S8 — lightweight CMS (posts, pages, collection metadata)

DO $$ BEGIN
  CREATE TYPE content_status AS ENUM ('draft', 'published');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  read_minutes INT NOT NULL DEFAULT 5,
  body JSONB NOT NULL DEFAULT '[]',
  status content_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_status_published ON posts (status, published_at DESC);

CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  eyebrow TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  body JSONB NOT NULL DEFAULT '[]',
  status content_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pages_status ON pages (status);

ALTER TABLE collections ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE collections ADD COLUMN IF NOT EXISTS hero_image TEXT NOT NULL DEFAULT '';
ALTER TABLE collections ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
